from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
import uuid

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.auth import PeerPrincipal, authorize_self_or_staff, create_peer_token
from app import auth
from app.config import settings
from app.database import get_db
from app.models.db_models import PeerAuditLog, PeerConnectRequest, PeerRequester, PeerSignup, PeerStatusHistory, RateLimitBucket, SupporterReport
from app.routers import peer
from app.services.peer_security import decrypt_private_data, encrypt_private_data, public_supporter_dict
from app.services.rate_limits import enforce_persistent_rate_limit


class FakeScalars:
    def __init__(self, items):
        self.items = items

    def all(self):
        return list(self.items)

    def first(self):
        return self.items[0] if self.items else None


class FakeResult:
    def __init__(self, items):
        self.items = items

    def scalars(self):
        return FakeScalars(self.items)

    def scalar_one_or_none(self):
        return self.items[0] if self.items else None


class FakeDb:
    def __init__(self, items=None):
        self.items = list(items or [])
        self.added = []
        self.commits = 0
        self.rollbacks = 0
        self.bucket = None

    async def execute(self, statement):
        if "rate_limit_buckets" in str(statement):
            return FakeResult([self.bucket] if self.bucket else [])
        return FakeResult(self.items)

    def add(self, value):
        self.added.append(value)
        if isinstance(value, RateLimitBucket):
            self.bucket = value

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


class PurgeDb(FakeDb):
    def __init__(self, supporter, requester, connection, report):
        super().__init__()
        self.by_table = {
            "peer_signups": [supporter],
            "peer_requesters": [requester],
            "peer_connect_requests": [connection],
            "supporter_reports": [report],
        }

    async def execute(self, statement):
        sql = str(statement)
        for table, items in self.by_table.items():
            if f"FROM {table}" in sql and sql.lstrip().startswith("SELECT"):
                return FakeResult(items)
        if sql.lstrip().startswith("DELETE"):
            return SimpleNamespace(rowcount=1)
        return FakeResult([])


class TableDb(FakeDb):
    def __init__(self, by_table=None):
        super().__init__()
        self.by_table = by_table or {}

    async def execute(self, statement):
        sql = str(statement)
        if "rate_limit_buckets" in sql:
            return await super().execute(statement)
        for table, items in self.by_table.items():
            if f"FROM {table}" in sql:
                return FakeResult(items)
        return FakeResult([])


def peer_app(db):
    app = FastAPI()
    app.include_router(peer.router, prefix="/api/v1")

    async def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    return app


@pytest.fixture
def peer_security_settings(monkeypatch):
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", True)
    monkeypatch.setattr(settings, "FEATURE_SUPPORTER_SIGNUP", True)
    monkeypatch.setattr(settings, "PEER_AUTH_SECRET", "peer-test-secret-that-is-at-least-32-characters")
    monkeypatch.setattr(settings, "PEER_PII_ENCRYPTION_KEY", Fernet.generate_key().decode())


def test_public_supporter_serializer_never_exposes_private_contact(peer_security_settings):
    supporter_id = uuid.uuid4()
    supporter = SimpleNamespace(
        supporter_id=supporter_id,
        name="Safe Display Name",
        year="Senior",
        major="History",
        locations=["Uris Library"],
        availability=["Weekdays"],
        interests=["Reading"],
        about="Peer listener.",
        email="private@cornell.edu",
        phone="+16075551234",
        private_data_encrypted=encrypt_private_data({"email": "private@cornell.edu", "phone": "+16075551234"}),
        status="approved",
        deleted_at=None,
        withdrawn_at=None,
        retention_expires_at=datetime(2027, 1, 1, tzinfo=timezone.utc),
        submitted_at=datetime.now(timezone.utc),
    )
    public = public_supporter_dict(supporter)
    assert public["supporter_id"] == str(supporter_id)
    assert "email" not in public and "phone" not in public and "private" not in public

    with TestClient(peer_app(FakeDb([supporter]))) as client:
        response = client.get("/api/v1/peer-supporters")
    assert response.status_code == 200
    assert response.json() == [public]
    assert "private@cornell.edu" not in response.text
    assert "+16075551234" not in response.text


def test_private_data_is_encrypted_and_tamper_protected(peer_security_settings):
    value = {"email": "student@cornell.edu", "phone": "+16075551234", "message": "private"}
    encrypted = encrypt_private_data(value)
    assert "student@cornell.edu" not in encrypted
    assert decrypt_private_data(encrypted) == value
    with pytest.raises(HTTPException, match="Protected peer data"):
        decrypt_private_data(encrypted[:-2] + "xx")


def test_roles_are_authenticated_and_staff_authorization_is_enforced(peer_security_settings):
    app = peer_app(FakeDb())
    moderator = create_peer_token("moderator", "moderator")
    supporter = create_peer_token("supporter", str(uuid.uuid4()))
    requester = create_peer_token("requester", str(uuid.uuid4()))
    with TestClient(app) as client:
        assert client.get("/api/v1/reports").status_code == 401
        assert client.get("/api/v1/reports", headers={"Authorization": f"Bearer {supporter}"}).status_code == 403
        assert client.get("/api/v1/peer-requests", headers={"Authorization": f"Bearer {requester}"}).status_code == 403
        assert client.get("/api/v1/reports", headers={"Authorization": f"Bearer {moderator}"}).status_code == 200


def test_owner_checks_prevent_cross_account_access():
    owner = PeerPrincipal(subject_id="owner-id", role="supporter")
    authorize_self_or_staff(owner, "owner-id")
    with pytest.raises(HTTPException) as exc:
        authorize_self_or_staff(owner, "someone-else")
    assert exc.value.status_code == 403
    authorize_self_or_staff(PeerPrincipal("moderator", "moderator"), "someone-else")


def test_supporter_withdrawal_erases_private_fields_and_preserves_tombstone(peer_security_settings):
    supporter_id = uuid.uuid4()
    supporter = SimpleNamespace(
        supporter_id=supporter_id,
        status="approved",
        approved=True,
        deleted_at=None,
        withdrawn_at=None,
        private_data_encrypted=encrypt_private_data({"email": "private@cornell.edu", "phone": "+16075551234"}),
        credential_hash="stored-hash",
        email="legacy@cornell.edu",
        phone="+16075550000",
        ref_name="Legacy Reference",
        ref_phone="+16075550001",
        ref_email="reference@cornell.edu",
        ref_relationship="Advisor",
    )
    token = create_peer_token("supporter", str(supporter_id))
    with TestClient(peer_app(FakeDb([supporter]))) as client:
        response = client.post(f"/api/v1/peer/supporters/{supporter_id}/withdraw", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["private_data_deleted"] is True
    assert supporter.status == "withdrawn"
    assert supporter.approved is False
    assert supporter.private_data_encrypted is None
    assert supporter.credential_hash is None
    assert supporter.email is None and supporter.phone is None and supporter.ref_email is None


def test_cross_account_withdrawal_is_forbidden_before_database_access(peer_security_settings):
    owner_id = uuid.uuid4()
    other_token = create_peer_token("supporter", str(uuid.uuid4()))
    with TestClient(peer_app(FakeDb())) as client:
        response = client.post(f"/api/v1/peer/supporters/{owner_id}/withdraw", headers={"Authorization": f"Bearer {other_token}"})
    assert response.status_code == 403


def test_private_requester_contact_is_visible_only_to_addressed_supporter(peer_security_settings):
    supporter_id = uuid.uuid4()
    requester_id = uuid.uuid4()
    connection = SimpleNamespace(
        request_id=uuid.uuid4(),
        supporter_id=supporter_id,
        requester_id=requester_id,
        status="pending",
        deleted_at=None,
        requested_at=datetime.now(timezone.utc),
        private_data_encrypted=encrypt_private_data({"display_name": "Requester", "email": "requester@cornell.edu", "phone": "+16075551234", "preferred_location": "Uris", "preferred_time": "Friday", "message": "Hello"}),
    )
    supporter = SimpleNamespace(supporter_id=supporter_id)
    owner_token = create_peer_token("supporter", str(supporter_id))
    other_token = create_peer_token("supporter", str(uuid.uuid4()))
    with TestClient(peer_app(TableDb({"peer_signups": [supporter], "peer_connect_requests": [connection]}))) as client:
        owner_response = client.get(f"/api/v1/peer/supporters/{supporter_id}/requests", headers={"Authorization": f"Bearer {owner_token}"})
        other_response = client.get(f"/api/v1/peer/supporters/{supporter_id}/requests", headers={"Authorization": f"Bearer {other_token}"})
    assert owner_response.status_code == 200
    assert owner_response.json()[0]["requester_contact"]["email"] == "requester@cornell.edu"
    assert other_response.status_code == 403
    assert "requester@cornell.edu" not in other_response.text


def test_withdrawn_supporter_token_cannot_read_requester_contact(peer_security_settings):
    supporter_id = uuid.uuid4()
    connection = SimpleNamespace(
        request_id=uuid.uuid4(),
        supporter_id=supporter_id,
        requester_id=uuid.uuid4(),
        status="pending",
        deleted_at=None,
        requested_at=datetime.now(timezone.utc),
        private_data_encrypted=encrypt_private_data({"email": "requester@cornell.edu"}),
    )
    token = create_peer_token("supporter", str(supporter_id))
    db = TableDb({"peer_signups": [], "peer_connect_requests": [connection]})
    with TestClient(peer_app(db)) as client:
        response = client.get(f"/api/v1/peer/supporters/{supporter_id}/requests", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "requester@cornell.edu" not in response.text


def test_withdrawn_requester_token_cannot_submit_report(peer_security_settings):
    requester_id = uuid.uuid4()
    supporter_id = uuid.uuid4()
    token = create_peer_token("requester", str(requester_id))
    db = TableDb({"peer_requesters": [], "peer_signups": [SimpleNamespace(supporter_id=supporter_id)]})
    with TestClient(peer_app(db)) as client:
        response = client.post(
            "/api/v1/report-supporter",
            headers={"Authorization": f"Bearer {token}"},
            json={"supporter_id": str(supporter_id), "reason": "A sufficiently detailed safety concern."},
        )
    assert response.status_code == 403
    assert not any(isinstance(item, SupporterReport) for item in db.added)


def valid_signup_payload():
    return {
        "display_name": "Student Supporter",
        "email": "supporter@cornell.edu",
        "phone": "+16072551111",
        "password": "long-test-password",
        "year": "Senior",
        "major": "History",
        "locations": ["Uris Library"],
        "availability": ["Weekday afternoons"],
        "interests": ["Reading"],
        "about": "I can listen.",
        "reference_name": "Reference Person",
        "reference_phone": "+16072552222",
        "reference_email": "reference@cornell.edu",
        "reference_relationship": "Advisor",
    }


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("display_name", "<script>alert(1)</script>"),
        ("email", "victim@cornell.edu\r\nBcc:attacker@example.com"),
        ("phone", "call-me-maybe"),
        ("about", "x" * 501),
        ("locations", [f"place-{index}" for index in range(6)]),
        ("interests", ["same", "same"]),
    ],
)
def test_supporter_validation_rejects_injection_and_abuse(field, value):
    payload = valid_signup_payload()
    payload[field] = value
    with pytest.raises(ValidationError):
        peer.SupporterSignupRequest.model_validate(payload)


def test_connection_and_report_use_immutable_ids_and_forbid_extra_name_fields():
    supporter_id = uuid.uuid4()
    connection = peer.ConnectRequest.model_validate({"supporter_id": supporter_id, "preferred_location": "Uris Library", "preferred_time": "Tomorrow at 3", "message": "Hello"})
    assert connection.supporter_id == supporter_id
    with pytest.raises(ValidationError):
        peer.ConnectRequest.model_validate({"supporter_id": supporter_id, "supporter_name": "Mutable Name", "preferred_location": "Uris", "preferred_time": "Tomorrow"})
    with pytest.raises(ValidationError):
        peer.ReportRequest.model_validate({"supporter_id": supporter_id, "reason": "<b>unsafe report</b>"})


@pytest.mark.asyncio
async def test_rate_limit_is_database_backed_and_returns_retry_after(peer_security_settings):
    db = FakeDb()
    now = datetime(2026, 8, 2, tzinfo=timezone.utc)
    await enforce_persistent_rate_limit(db, "abuse-test", "203.0.113.10", 2, 60, now)
    await enforce_persistent_rate_limit(db, "abuse-test", "203.0.113.10", 2, 60, now)
    with pytest.raises(HTTPException) as exc:
        await enforce_persistent_rate_limit(db, "abuse-test", "203.0.113.10", 2, 60, now)
    assert exc.value.status_code == 429
    assert exc.value.headers["Retry-After"] == "60"
    assert db.commits == 2


@pytest.mark.asyncio
async def test_retention_purge_erases_all_peer_pii_and_expired_control_rows(peer_security_settings):
    now = datetime(2026, 8, 2, tzinfo=timezone.utc)
    supporter = PeerSignup(name="Private Name", year="Senior", email="private@cornell.edu", phone="+16075551234", ref_name="Reference", ref_phone="+16075550000", ref_email="ref@cornell.edu", ref_relationship="Advisor", about="Private profile", major="History", locations=["Uris"], availability=["Friday"], interests=["Reading"], approved=True, status="approved", private_data_encrypted=encrypt_private_data({"email": "private@cornell.edu"}), credential_hash="hash", retention_expires_at=now)
    requester = PeerRequester(credential_hash="hash", private_data_encrypted=encrypt_private_data({"email": "requester@cornell.edu"}), status="active", retention_expires_at=now)
    connection = PeerConnectRequest(status="pending", private_data_encrypted=encrypt_private_data({"message": "private"}), requester_name="Requester", requester_email="requester@cornell.edu", requester_phone="+16075550001", preferred_location="Uris", preferred_time="Friday", message="private", retention_expires_at=now)
    report = SupporterReport(status="open", private_data_encrypted=encrypt_private_data({"reason": "private reason"}), reporter_email="reporter@cornell.edu", reason="private reason", retention_expires_at=now)
    db = PurgeDb(supporter, requester, connection, report)
    response = await peer.purge_expired_peer_data(PeerPrincipal("administrator", "administrator"), None, db)
    assert response["records"]["rate_limit_buckets"] == 1
    assert supporter.name == "Expired supporter" and supporter.email is None and supporter.private_data_encrypted is None
    assert decrypt_private_data(requester.private_data_encrypted) == {"expired": True}
    assert connection.message is None and connection.requester_email is None and connection.private_data_encrypted is None
    assert report.reason is None and report.reporter_email is None and report.private_data_encrypted is None


def test_audit_status_and_rate_limit_models_exist_without_pii_fields():
    assert set(PeerAuditLog.__table__.columns.keys()) == {"audit_id", "actor_role", "actor_id", "action", "target_type", "target_id", "event_metadata", "occurred_at", "retention_expires_at"}
    assert "reason" not in PeerAuditLog.__table__.columns
    assert "email" not in PeerAuditLog.__table__.columns
    assert "new_status" in PeerStatusHistory.__table__.columns
    assert {"scope", "subject_hash", "window_started_at", "count", "expires_at"}.issubset(RateLimitBucket.__table__.columns.keys())


def test_audit_metadata_allowlist_drops_contact_and_free_text():
    db = FakeDb()
    peer._audit(db, PeerPrincipal("moderator", "moderator"), "report.read", "report", str(uuid.uuid4()), {"email": "private@cornell.edu", "reason": "private text", "from": "open", "to": "resolved"})
    audit = next(item for item in db.added if isinstance(item, PeerAuditLog))
    assert audit.event_metadata == {"from": "open", "to": "resolved"}


def test_migration_is_additive_and_backfill_defaults_to_dry_run():
    root = Path(__file__).resolve().parents[2]
    migration = (root / "backend" / "migrations" / "20260802_peer_security_redesign.sql").read_text(encoding="utf-8").lower()
    backfill = (root / "backend" / "scripts" / "backfill_peer_pii.py").read_text(encoding="utf-8")
    assert "drop table" not in migration
    assert "drop column" not in migration
    assert "delete from" not in migration
    assert "supporter_id" in migration and "request_id" in migration
    assert "--apply" in backfill
    assert "if apply" in backfill


def test_production_rejects_enabled_peer_features_without_security_secrets(monkeypatch):
    import bcrypt

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://cornellpulse.example")
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "admin-production-secret-that-is-at-least-32-characters")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", bcrypt.hashpw(b"admin-password", bcrypt.gensalt()).decode())
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", True)
    monkeypatch.setattr(settings, "PEER_AUTH_SECRET", "")
    monkeypatch.setattr(settings, "PEER_PII_ENCRYPTION_KEY", "")
    monkeypatch.setattr(settings, "MODERATOR_PASSWORD_HASH", "")
    with pytest.raises(RuntimeError, match="PEER_AUTH_SECRET"):
        auth.validate_security_settings()
