from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
import uuid

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import create_peer_token
from app.config import settings
from app.database import get_db
from app.models.db_models import (
    PeerAuditLog,
    PeerBlock,
    PeerConnectionReport,
    PeerConnectRequest,
    PeerRelayMessage,
    PeerRequester,
    PeerSignup,
    PeerStatusHistory,
)
from app.routers import peer
from app.services.connection_flow import CONNECTION_STATES, contains_contact_details, transition_allowed
from app.services.peer_security import decrypt_private_data, encrypt_private_data


class Result:
    def __init__(self, values):
        self.values = list(values)

    def scalar_one_or_none(self):
        return self.values[0] if self.values else None

    def scalars(self):
        return SimpleNamespace(all=lambda: list(self.values))


class LifecycleDb:
    def __init__(self, requester, supporter):
        self.tables = {
            "peer_requesters": [requester],
            "peer_signups": [supporter],
            "peer_connect_requests": [],
            "peer_relay_messages": [],
            "peer_blocks": [],
            "peer_connection_reports": [],
        }
        self.audit = []

    async def execute(self, statement):
        sql = str(statement)
        for table, values in self.tables.items():
            if f"FROM {table}" in sql:
                if table == "peer_connect_requests" and "status IN" in sql and values:
                    active = [item for item in values if item.status in {"pending", "accepted"}]
                    return Result(active)
                return Result(values)
        return Result([])

    def add(self, value):
        if isinstance(value, PeerConnectRequest):
            self.tables["peer_connect_requests"].append(value)
        elif isinstance(value, PeerRelayMessage):
            self.tables["peer_relay_messages"].append(value)
        elif isinstance(value, PeerBlock):
            self.tables["peer_blocks"].append(value)
        elif isinstance(value, PeerConnectionReport):
            self.tables["peer_connection_reports"].append(value)
        elif isinstance(value, (PeerAuditLog, PeerStatusHistory)):
            self.audit.append(value)

    async def commit(self):
        return None

    async def rollback(self):
        return None


@pytest.fixture
def lifecycle(monkeypatch):
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", True)
    monkeypatch.setattr(settings, "PEER_AUTH_SECRET", "peer-test-secret-that-is-at-least-32-characters")
    monkeypatch.setattr(settings, "PEER_PII_ENCRYPTION_KEY", Fernet.generate_key().decode())
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    async def no_rate_limit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(peer, "enforce_persistent_rate_limit", no_rate_limit)
    now = datetime.now(timezone.utc)
    requester_id = uuid.uuid4()
    supporter_id = uuid.uuid4()
    requester = PeerRequester(
        requester_id=requester_id,
        credential_hash="unused",
        private_data_encrypted=encrypt_private_data({"email": "requester@cornell.edu", "phone": "+16075550100"}),
        status="active",
        identity_verified_at=now,
        identity_verification_method="manual_nonproduction_review",
        identity_subject_hash="requester-verified",
        retention_expires_at=now + timedelta(days=30),
    )
    supporter = PeerSignup(
        supporter_id=supporter_id,
        name="Supporter",
        status="approved",
        approved=True,
        credential_hash="unused",
        private_data_encrypted=encrypt_private_data({"email": "supporter@cornell.edu", "phone": "+16075550200"}),
        identity_verified_at=now,
        identity_verification_method="manual_nonproduction_review",
        identity_subject_hash="supporter-verified",
        retention_expires_at=now + timedelta(days=30),
    )
    db = LifecycleDb(requester, supporter)
    app = FastAPI()
    app.include_router(peer.router, prefix="/api/v1")

    async def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    return app, db, requester_id, supporter_id


def test_complete_double_opt_in_relay_cancel_and_report_lifecycle(lifecycle):
    app, db, requester_id, supporter_id = lifecycle
    requester_token = create_peer_token("requester", str(requester_id))
    supporter_token = create_peer_token("supporter", str(supporter_id))
    with TestClient(app) as client:
        created = client.post(
            "/api/v1/peer-connect",
            headers={"Authorization": f"Bearer {requester_token}"},
            json={
                "supporter_id": str(supporter_id),
                "location_id": "olin_library_common_area",
                "meeting_window_id": "weekday_daytime",
                "requester_consent": True,
                "message": "Could we talk in the library common area?",
            },
        )
        assert created.status_code == 201
        created_body = created.json()
        assert created_body["status"] == "pending"
        assert created_body["requester_consented"] is True
        assert created_body["supporter_consented"] is False
        assert "requester@cornell.edu" not in created.text
        assert "+16075550100" not in created.text

        request_id = created_body["request_id"]
        supporter_list = client.get(f"/api/v1/peer/supporters/{supporter_id}/requests", headers={"Authorization": f"Bearer {supporter_token}"})
        assert supporter_list.status_code == 200
        assert "requester@cornell.edu" not in supporter_list.text
        assert supporter_list.json()[0]["request"]["location"]["id"] == "olin_library_common_area"

        accepted = client.post(f"/api/v1/peer-requests/{request_id}/supporter-action", headers={"Authorization": f"Bearer {supporter_token}"}, json={"action": "accept"})
        assert accepted.status_code == 200
        assert accepted.json()["status"] == "accepted"
        assert accepted.json()["relay_available"] is True

        contact_attempt = client.post(f"/api/v1/peer-requests/{request_id}/messages", headers={"Authorization": f"Bearer {requester_token}"}, json={"body": "Email me at requester@cornell.edu"})
        assert contact_attempt.status_code == 422
        sent = client.post(f"/api/v1/peer-requests/{request_id}/messages", headers={"Authorization": f"Bearer {requester_token}"}, json={"body": "Does Tuesday in the selected window work?"})
        assert sent.status_code == 201
        assert sent.json()["status"] == "sent"
        relay = db.tables["peer_relay_messages"][0]
        assert "Tuesday" not in relay.body_encrypted
        assert decrypt_private_data(relay.body_encrypted)["body"].startswith("Does Tuesday")
        moderator_token = create_peer_token("moderator", "moderator")
        staff_read = client.get(f"/api/v1/peer-requests/{request_id}/messages", headers={"Authorization": f"Bearer {moderator_token}"})
        assert staff_read.status_code == 403
        participant_read = client.get(f"/api/v1/peer-requests/{request_id}/messages", headers={"Authorization": f"Bearer {supporter_token}"})
        assert participant_read.status_code == 200
        assert participant_read.json()[0]["body"].startswith("Does Tuesday")

        report = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {supporter_token}"}, json={"reason": "The requester sent a concerning message in the relay."})
        assert report.status_code == 201
        assert report.json()["status"] == "open"
        assert "concerning message" not in db.tables["peer_connection_reports"][0].reason_encrypted

        canceled = client.post(f"/api/v1/peer-requests/{request_id}/cancel", headers={"Authorization": f"Bearer {requester_token}"})
        assert canceled.status_code == 200
        assert canceled.json()["status"] == "canceled"


def test_connection_states_are_truthful_and_terminal():
    assert CONNECTION_STATES == ("pending", "failed", "declined", "expired", "accepted", "unavailable", "canceled", "blocked")
    for terminal in ("failed", "declined", "expired", "unavailable", "canceled", "blocked"):
        assert not any(transition_allowed(terminal, candidate) for candidate in CONNECTION_STATES)
    assert transition_allowed("pending", "accepted")
    assert transition_allowed("accepted", "canceled")


@pytest.mark.parametrize(("action", "expected"), [("decline", "declined"), ("expire", "expired"), ("block", "blocked")])
def test_supporter_terminal_actions_are_server_confirmed(lifecycle, action, expected):
    app, db, requester_id, supporter_id = lifecycle
    requester_token = create_peer_token("requester", str(requester_id))
    supporter_token = create_peer_token("supporter", str(supporter_id))
    with TestClient(app) as client:
        created = client.post("/api/v1/peer-connect", headers={"Authorization": f"Bearer {requester_token}"}, json={"supporter_id": str(supporter_id), "location_id": "mann_library_common_area", "meeting_window_id": "weekend_daytime", "requester_consent": True})
        request_id = created.json()["request_id"]
        response = client.post(f"/api/v1/peer-requests/{request_id}/supporter-action", headers={"Authorization": f"Bearer {supporter_token}"}, json={"action": action})
        assert response.status_code == 200
        assert response.json()["status"] == expected
        if action == "block":
            assert len(db.tables["peer_blocks"]) == 1
            retry = client.post("/api/v1/peer-connect", headers={"Authorization": f"Bearer {requester_token}"}, json={"supporter_id": str(supporter_id), "location_id": "mann_library_common_area", "meeting_window_id": "weekend_daytime", "requester_consent": True})
            assert retry.status_code == 403
            assert "unavailable" in retry.json()["detail"].lower()


def test_staff_can_mark_pending_request_unavailable(lifecycle):
    app, _db, requester_id, supporter_id = lifecycle
    requester_token = create_peer_token("requester", str(requester_id))
    moderator_token = create_peer_token("moderator", "moderator")
    with TestClient(app) as client:
        created = client.post("/api/v1/peer-connect", headers={"Authorization": f"Bearer {requester_token}"}, json={"supporter_id": str(supporter_id), "location_id": "duffield_atrium", "meeting_window_id": "weekday_early_evening", "requester_consent": True})
        response = client.post(f"/api/v1/peer-requests/{created.json()['request_id']}/resolve", headers={"Authorization": f"Bearer {moderator_token}"})
    assert response.status_code == 200
    assert response.json()["status"] == "unavailable"


def test_unverified_requester_cannot_create_connection(lifecycle):
    app, db, requester_id, supporter_id = lifecycle
    db.tables["peer_requesters"][0].identity_verified_at = None
    requester_token = create_peer_token("requester", str(requester_id))
    with TestClient(app) as client:
        response = client.post("/api/v1/peer-connect", headers={"Authorization": f"Bearer {requester_token}"}, json={"supporter_id": str(supporter_id), "location_id": "duffield_atrium", "meeting_window_id": "weekday_daytime", "requester_consent": True})
    assert response.status_code == 403
    assert db.tables["peer_connect_requests"] == []


@pytest.mark.parametrize("value", ["student@cornell.edu", "+1 (607) 555-1234", "https://example.com/me", "@socialhandle"])
def test_relay_contact_detector_rejects_direct_contact_exchange(value):
    assert contains_contact_details(value)


def test_public_meeting_options_exclude_unsafe_late_night_framing(lifecycle):
    app, *_ = lifecycle
    with TestClient(app) as client:
        response = client.get("/api/v1/peer/public-meeting-options")
    assert response.status_code == 200
    body = response.text.lower()
    assert "residence" in body and "private vehicles" in body
    assert "late-night meetings are not offered" in body
    assert all("late" not in item["id"] for item in response.json()["meeting_windows"])


def test_connection_reads_and_mutations_reject_unauthenticated_users(lifecycle):
    app, _db, requester_id, supporter_id = lifecycle
    request_id = uuid.uuid4()
    with TestClient(app) as client:
        checks = [
            client.get("/api/v1/peer-requests"),
            client.get(f"/api/v1/peer/supporters/{supporter_id}/requests"),
            client.get(f"/api/v1/peer/requesters/{requester_id}/requests"),
            client.post("/api/v1/peer-connect", json={"supporter_id": str(supporter_id), "location_id": "duffield_atrium", "meeting_window_id": "weekday_daytime", "requester_consent": True}),
            client.post(f"/api/v1/peer-requests/{request_id}/supporter-action", json={"action": "accept"}),
            client.post(f"/api/v1/peer-requests/{request_id}/cancel"),
            client.get(f"/api/v1/peer-requests/{request_id}/messages"),
            client.post(f"/api/v1/peer-requests/{request_id}/messages", json={"body": "hello"}),
            client.post(f"/api/v1/peer-requests/{request_id}/report", json={"reason": "A sufficiently detailed safety concern."}),
        ]
    assert all(response.status_code == 401 for response in checks)


def test_connection_migration_is_additive_and_quarantines_legacy_active_states():
    migration = (Path(__file__).resolve().parents[1] / "migrations" / "20260803_connection_relay.sql").read_text(encoding="utf-8").lower()
    assert "drop table" not in migration
    assert "drop column" not in migration
    assert "delete from" not in migration
    assert "requester_consented_at is null" in migration
    assert "set status = 'unavailable'" in migration
    assert "uq_peer_active_connection_pair" in migration
    assert "peer_relay_messages" in migration
    assert "peer_blocks" in migration
    assert "peer_connection_reports" in migration
