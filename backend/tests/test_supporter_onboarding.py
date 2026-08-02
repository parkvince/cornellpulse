from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
import uuid

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.auth import PeerPrincipal, create_peer_token
from app import auth
from app.config import settings
from app.database import get_db
from app.models.db_models import PeerSignup, SupporterReferenceInvitation
from app.routers import peer
from app.services.peer_security import decrypt_private_data, encrypt_private_data, public_supporter_dict
from app.services.supporter_onboarding import (
    SUPPORTER_APPLICATION_STATES,
    SUPPORTER_POLICY_VERSION,
    SUPPORTER_TRAINING_MODULES,
    SUPPORTER_TRAINING_VERSION,
    SUPPORTER_TRANSITIONS,
    transition_allowed,
)


class Result:
    def __init__(self, items):
        self.items = list(items)

    def scalar_one_or_none(self):
        return self.items[0] if self.items else None

    def scalars(self):
        return SimpleNamespace(all=lambda: list(self.items))


class OnboardingDb:
    def __init__(self, supporter=None, invitations=None):
        self.supporter = supporter
        self.invitations = list(invitations or [])
        self.added = []
        self.commits = 0
        self.rollbacks = 0
        self.rate_bucket = None

    async def execute(self, statement):
        sql = str(statement)
        if "rate_limit_buckets" in sql:
            return Result([self.rate_bucket] if self.rate_bucket else [])
        if "supporter_reference_invitations" in sql:
            return Result(self.invitations)
        if "peer_signups" in sql:
            return Result([self.supporter] if self.supporter else [])
        return Result([])

    def add(self, value):
        self.added.append(value)
        if value.__class__.__name__ == "RateLimitBucket":
            self.rate_bucket = value
        if isinstance(value, SupporterReferenceInvitation):
            self.invitations.append(value)

    async def commit(self):
        self.commits += 1

    async def rollback(self):
        self.rollbacks += 1


def supporter(state="draft"):
    now = datetime.now(timezone.utc)
    return PeerSignup(
        supporter_id=uuid.uuid4(),
        name="Supporter Display",
        year="Senior",
        major="History",
        locations=["Uris Library"],
        availability=["Weekdays"],
        interests=["Reading"],
        about="Available to listen.",
        approved=state == "approved",
        status=state,
        credential_hash="hash",
        private_data_encrypted="ciphertext",
        policy_version=SUPPORTER_POLICY_VERSION,
        policy_accepted_at=now,
        identity_verified_at=now,
        identity_verification_method="manual_nonproduction_review",
        identity_subject_hash="a" * 64,
        identity_verified_by="administrator",
        training_requirements_version=SUPPORTER_TRAINING_VERSION,
        training_modules_completed=list(SUPPORTER_TRAINING_MODULES),
        training_completed_at=now,
        training_evidence_hash="b" * 64,
        training_verified_by="administrator",
        retention_expires_at=now + timedelta(days=365),
        withdrawn_at=None,
        deleted_at=None,
    )


def accepted_invitation(supporter_id):
    now = datetime.now(timezone.utc)
    return SupporterReferenceInvitation(
        invitation_id=uuid.uuid4(),
        supporter_id=supporter_id,
        token_hash="c" * 64,
        invitee_email_encrypted="ciphertext",
        response_encrypted="ciphertext",
        status="accepted",
        consented_at=now,
        responded_at=now,
        expires_at=now + timedelta(days=14),
        deleted_at=None,
    )


@pytest.fixture
def onboarding_settings(monkeypatch):
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", True)
    monkeypatch.setattr(settings, "FEATURE_SUPPORTER_SIGNUP", True)
    monkeypatch.setattr(settings, "PEER_AUTH_SECRET", "peer-test-secret-that-is-at-least-32-characters")
    monkeypatch.setattr(settings, "PEER_PII_ENCRYPTION_KEY", Fernet.generate_key().decode())


def test_state_machine_contains_every_required_state_and_transition_boundary():
    assert set(SUPPORTER_APPLICATION_STATES) == {
        "draft", "submitted", "identity_pending", "reference_pending", "training_pending",
        "review", "approved", "suspended", "withdrawn", "rejected",
    }
    for current in SUPPORTER_APPLICATION_STATES:
        for target in SUPPORTER_APPLICATION_STATES:
            assert transition_allowed(current, target) is (target in SUPPORTER_TRANSITIONS[current])


@pytest.mark.asyncio
async def test_complete_happy_path_requires_each_gate_and_supports_suspension(onboarding_settings):
    record = supporter("submitted")
    invitation = accepted_invitation(record.supporter_id)
    db = OnboardingDb(record, [invitation])
    admin = PeerPrincipal("administrator", "administrator")
    moderator = PeerPrincipal("moderator", "moderator")

    await peer._transition_supporter(db, record, admin, "identity_pending", "administrative_review")
    await peer._transition_supporter(db, record, admin, "reference_pending", "requirements_complete")
    await peer._transition_supporter(db, record, admin, "training_pending", "requirements_complete")
    await peer._transition_supporter(db, record, admin, "review", "requirements_complete")
    await peer._transition_supporter(db, record, admin, "approved", "requirements_complete")
    assert record.status == "approved" and record.approved is True

    await peer._transition_supporter(db, record, moderator, "suspended", "safety_review")
    assert record.status == "suspended" and record.approved is False
    await peer._transition_supporter(db, record, admin, "review", "administrative_review")
    assert record.status == "review"


@pytest.mark.asyncio
async def test_gate_failures_cannot_be_bypassed(onboarding_settings):
    admin = PeerPrincipal("administrator", "administrator")

    identity_pending = supporter("identity_pending")
    identity_pending.identity_verified_at = None
    identity_pending.identity_subject_hash = None
    with pytest.raises(HTTPException, match="identity verification"):
        await peer._transition_supporter(OnboardingDb(identity_pending), identity_pending, admin, "reference_pending", "requirements_complete")

    reference_pending = supporter("reference_pending")
    with pytest.raises(HTTPException, match="consented reference"):
        await peer._transition_supporter(OnboardingDb(reference_pending), reference_pending, admin, "training_pending", "requirements_complete")

    training_pending = supporter("training_pending")
    training_pending.training_modules_completed = []
    with pytest.raises(HTTPException, match="training requirement"):
        await peer._transition_supporter(OnboardingDb(training_pending), training_pending, admin, "review", "requirements_complete")

    review = supporter("review")
    review.policy_accepted_at = None
    db = OnboardingDb(review, [accepted_invitation(review.supporter_id)])
    with pytest.raises(HTTPException, match="policy acceptance"):
        await peer._transition_supporter(db, review, admin, "approved", "requirements_complete")


@pytest.mark.asyncio
async def test_moderator_may_only_suspend_and_nonstaff_cannot_transition(onboarding_settings):
    record = supporter("submitted")
    db = OnboardingDb(record)
    with pytest.raises(HTTPException) as moderator_error:
        await peer._transition_supporter(db, record, PeerPrincipal("moderator", "moderator"), "identity_pending", "administrative_review")
    assert moderator_error.value.status_code == 403

    with pytest.raises(HTTPException) as requester_error:
        await peer._transition_supporter(db, record, PeerPrincipal(str(uuid.uuid4()), "requester"), "identity_pending", "administrative_review")
    assert requester_error.value.status_code == 403


@pytest.mark.asyncio
@pytest.mark.parametrize("current", ["submitted", "identity_pending", "reference_pending", "training_pending", "review", "suspended"])
async def test_administrator_rejection_transition_from_every_reviewable_state(onboarding_settings, current):
    record = supporter(current)
    await peer._transition_supporter(OnboardingDb(record), record, PeerPrincipal("administrator", "administrator"), "rejected", "application_incomplete")
    assert record.status == "rejected" and record.approved is False and record.rejected_at is not None


@pytest.mark.asyncio
async def test_draft_submission_requires_current_policy_and_owner(onboarding_settings, monkeypatch):
    record = supporter("draft")
    db = OnboardingDb(record)
    payload = peer.SupporterPolicyAcceptanceRequest.model_validate({
        "policy_version": SUPPORTER_POLICY_VERSION,
        "role_scope_accepted": True,
        "conduct_standards_accepted": True,
        "crisis_boundaries_accepted": True,
        "public_meeting_rules_accepted": True,
        "reporting_policy_accepted": True,
        "withdrawal_controls_acknowledged": True,
    })
    monkeypatch.setattr(peer, "_send_email", lambda *_: None)
    response = await peer.submit_supporter_application(record.supporter_id, payload, PeerPrincipal(str(record.supporter_id), "supporter"), None, db)
    assert response["status"] == "submitted"
    assert record.policy_accepted_at is not None

    other = supporter("draft")
    with pytest.raises(HTTPException) as error:
        await peer.submit_supporter_application(other.supporter_id, payload, PeerPrincipal(str(uuid.uuid4()), "supporter"), None, OnboardingDb(other))
    assert error.value.status_code == 403


def test_reference_invitation_collects_no_phone_and_content_requires_consent():
    invitation = peer.ReferenceInvitationRequest.model_validate({"email": "reference@cornell.edu"})
    assert invitation.model_dump() == {"email": "reference@cornell.edu"}
    with pytest.raises(ValidationError):
        peer.ReferenceInvitationRequest.model_validate({"email": "reference@cornell.edu", "phone": "+16075551234"})
    with pytest.raises(ValidationError):
        peer.ReferenceDecisionRequest.model_validate({"token": "a" * 43, "consent": True, "relationship": "Advisor", "statement": None})
    declined = peer.ReferenceDecisionRequest.model_validate({"token": "a" * 43, "consent": False})
    assert declined.relationship is None and declined.statement is None


@pytest.mark.asyncio
async def test_reference_invitation_token_is_hashed_and_response_is_encrypted_after_consent(onboarding_settings, monkeypatch):
    record = supporter("reference_pending")
    db = OnboardingDb(record)
    captured = {}

    async def no_rate_limit(*_args, **_kwargs):
        return None

    monkeypatch.setattr(peer, "enforce_persistent_rate_limit", no_rate_limit)
    monkeypatch.setattr(peer, "_send_reference_invitation", lambda email, token: captured.update({"email": email, "token": token}))
    created = await peer.create_reference_invitation(
        record.supporter_id,
        peer.ReferenceInvitationRequest(email="reference@example.edu"),
        SimpleNamespace(client=SimpleNamespace(host="203.0.113.10")),
        PeerPrincipal(str(record.supporter_id), "supporter"),
        None,
        db,
    )
    invitation = db.invitations[0]
    assert "token" not in created and "email" not in created
    assert invitation.token_hash != captured["token"]
    assert "reference@example.edu" not in invitation.invitee_email_encrypted

    decision = peer.ReferenceDecisionRequest(
        token=captured["token"],
        consent=True,
        relationship="Academic advisor",
        statement="I consent to provide this limited reference statement.",
    )
    response = await peer.respond_to_reference_invitation(decision, SimpleNamespace(client=SimpleNamespace(host="203.0.113.11")), db)
    assert response["status"] == "accepted"
    assert invitation.consented_at is not None
    assert decrypt_private_data(invitation.response_encrypted)["relationship"] == "Academic advisor"


def test_public_supporter_record_excludes_all_private_onboarding_fields():
    record = supporter("approved")
    record.email = "private@cornell.edu"
    record.phone = "+16075551234"
    public = public_supporter_dict(record)
    serialized = str(public)
    for forbidden in ("email", "phone", "identity", "reference", "training", "policy", "approved_at", "private@cornell.edu"):
        assert forbidden not in serialized


def test_permission_dependencies_protect_onboarding_routes(onboarding_settings):
    db = OnboardingDb()
    app = FastAPI()
    app.include_router(peer.router, prefix="/api/v1")

    async def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    supporter_id = uuid.uuid4()
    supporter_token = create_peer_token("supporter", str(supporter_id))
    moderator_token = create_peer_token("moderator", "moderator")
    other_supporter_token = create_peer_token("supporter", str(uuid.uuid4()))
    with TestClient(app) as client:
        assert client.post(f"/api/v1/peer-signups/{supporter_id}/transition", json={"target_status": "identity_pending"}).status_code == 401
        assert client.post(f"/api/v1/peer-signups/{supporter_id}/transition", headers={"Authorization": f"Bearer {supporter_token}"}, json={"target_status": "identity_pending"}).status_code == 403
        assert client.post(f"/api/v1/peer-signups/{supporter_id}/identity-verification", headers={"Authorization": f"Bearer {moderator_token}"}, json={"verification_reference": "evidence-123"}).status_code == 403
        assert client.post(f"/api/v1/peer-signups/{supporter_id}/training-completion", headers={"Authorization": f"Bearer {moderator_token}"}, json={}).status_code == 403
        assert client.get(f"/api/v1/peer-signups/{supporter_id}/reference-invitations", headers={"Authorization": f"Bearer {moderator_token}"}).status_code == 403
        assert client.post(f"/api/v1/peer-signups/{supporter_id}/reference-invitations", headers={"Authorization": f"Bearer {other_supporter_token}"}, json={"email": "reference@cornell.edu"}).status_code == 403
        assert client.post(f"/api/v1/peer/supporters/{supporter_id}/withdraw", headers={"Authorization": f"Bearer {moderator_token}"}).status_code == 403


@pytest.mark.asyncio
async def test_manual_identity_evidence_is_refused_in_production(onboarding_settings, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    with pytest.raises(HTTPException) as error:
        await peer.record_supporter_identity_verification(
            uuid.uuid4(),
            peer.IdentityVerificationEvidenceRequest(verification_reference="evidence-123"),
            PeerPrincipal("administrator", "administrator"),
            None,
            OnboardingDb(),
        )
    assert error.value.status_code == 503


def test_onboarding_migration_is_additive_and_has_no_reference_phone():
    from pathlib import Path

    migration = (Path(__file__).resolve().parents[2] / "backend" / "migrations" / "20260802_supporter_onboarding.sql").read_text(encoding="utf-8").lower()
    assert "drop table" not in migration and "drop column" not in migration and "delete from" not in migration and "truncate" not in migration
    assert "supporter_reference_invitations" in migration
    assert "phone" not in migration


def test_production_startup_blocks_peer_launch_without_cornell_identity_integration(monkeypatch):
    import bcrypt

    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://cornellpulse.example")
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", True)
    monkeypatch.setattr(settings, "FEATURE_SUPPORTER_SIGNUP", False)
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "admin-production-secret-that-is-at-least-32-characters")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", bcrypt.hashpw(b"admin-password", bcrypt.gensalt()).decode())
    monkeypatch.setattr(settings, "PEER_AUTH_SECRET", "peer-production-secret-that-is-at-least-32-characters")
    monkeypatch.setattr(settings, "PEER_PII_ENCRYPTION_KEY", Fernet.generate_key().decode())
    monkeypatch.setattr(settings, "MODERATOR_PASSWORD_HASH", bcrypt.hashpw(b"moderator-password", bcrypt.gensalt()).decode())
    with pytest.raises(RuntimeError, match="Cornell identity verification"):
        auth.validate_security_settings()
