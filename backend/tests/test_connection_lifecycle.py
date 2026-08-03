from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
import uuid

import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.auth import create_peer_token
from app import auth
from app.config import settings
from app.database import get_db
from app.models.db_models import (
    PeerAuditLog,
    PeerBlock,
    PeerConnectionReport,
    PeerConnectRequest,
    PeerModerationNote,
    PeerNotification,
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
            "peer_moderation_notes": [],
            "peer_notifications": [],
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
        elif isinstance(value, PeerModerationNote):
            self.tables["peer_moderation_notes"].append(value)
        elif isinstance(value, PeerNotification):
            self.tables["peer_notifications"].append(value)
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
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    monkeypatch.setattr(settings, "PEER_SAFETY_CONTACT_EMAIL", "safety@example.com")
    monkeypatch.setattr(settings, "PEER_APPROVAL_VERSION", "2026-08-03")
    monkeypatch.setattr(settings, "PEER_SAFETY_APPROVAL_ID", "safety-approved")
    monkeypatch.setattr(settings, "PEER_PRIVACY_APPROVAL_ID", "privacy-approved")
    monkeypatch.setattr(settings, "PEER_SECURITY_APPROVAL_ID", "security-approved")
    monkeypatch.setattr(settings, "PEER_OPERATIONS_APPROVAL_ID", "operations-approved")
    monkeypatch.setattr(auth, "CORNELL_IDENTITY_INTEGRATION_IMPLEMENTED", True)

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
        assert created_body["notification"]["status"] == "skipped"
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
        assert report.json()["status"] == "submitted"
        assert report.json()["notification"]["status"] == "skipped"
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
            client.get("/api/v1/peer/connection-reports"),
            client.get(f"/api/v1/peer/connection-reports/{request_id}"),
            client.post(f"/api/v1/peer/connection-reports/{request_id}/triage", json={"severity": "high", "assigned_to_role": "moderator", "assigned_to_id": "moderator"}),
            client.post(f"/api/v1/peer/connection-reports/{request_id}/notes", json={"note": "A sufficiently detailed moderation note."}),
            client.post(f"/api/v1/peer/connection-reports/{request_id}/resolve", json={"outcome": "resolved", "resolution_code": "no_action", "summary": "A sufficiently detailed resolution summary."}),
            client.post(f"/api/v1/peer/safety/subjects/requester/{requester_id}/status", json={"action": "suspend", "reason_code": "active_safety_review"}),
            client.get(f"/api/v1/peer/notifications/{request_id}"),
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
    safety_migration = (Path(__file__).resolve().parents[1] / "migrations" / "20260803_peer_safety_operations.sql").read_text(encoding="utf-8").lower()
    assert "drop table" not in safety_migration
    assert "drop column" not in safety_migration
    assert "delete from" not in safety_migration
    assert "truncate" not in safety_migration
    assert "uq_peer_active_report_submission" in safety_migration
    assert "peer_moderation_notes" in safety_migration
    assert "peer_notifications" in safety_migration
    router_source = (Path(__file__).resolve().parents[1] / "app" / "routers" / "peer.py").read_text(encoding="utf-8")
    assert 'connection-reports/export' not in router_source
    assert 'relay_messages.export' not in router_source


def _create_accepted_connection(client, requester_id, supporter_id):
    requester_token = create_peer_token("requester", str(requester_id))
    supporter_token = create_peer_token("supporter", str(supporter_id))
    created = client.post("/api/v1/peer-connect", headers={"Authorization": f"Bearer {requester_token}"}, json={"supporter_id": str(supporter_id), "location_id": "olin_library_common_area", "meeting_window_id": "weekday_daytime", "requester_consent": True})
    request_id = created.json()["request_id"]
    accepted = client.post(f"/api/v1/peer-requests/{request_id}/supporter-action", headers={"Authorization": f"Bearer {supporter_token}"}, json={"action": "accept"})
    assert accepted.status_code == 200
    return request_id, requester_token, supporter_token


def test_report_triage_assignment_notes_resolution_and_minimal_queue(lifecycle):
    app, db, requester_id, supporter_id = lifecycle
    moderator_token = create_peer_token("moderator", "moderator")
    with TestClient(app) as client:
        request_id, requester_token, _ = _create_accepted_connection(client, requester_id, supporter_id)
        submitted = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {requester_token}"}, json={"reason": "The supporter repeatedly ignored a clearly stated boundary."})
        report_id = submitted.json()["connection_report_id"]
        queue = client.get("/api/v1/peer/connection-reports", headers={"Authorization": f"Bearer {moderator_token}"})
        assert queue.status_code == 200
        assert "ignored a clearly stated boundary" not in queue.text
        spoofed_identity = client.post(f"/api/v1/peer/connection-reports/{report_id}/triage", headers={"Authorization": f"Bearer {create_peer_token('administrator', 'administrator')}"}, json={"severity": "high", "assigned_to_role": "moderator", "assigned_to_id": "spoofed-moderator"})
        assert spoofed_identity.status_code == 422
        spoofed_assignment = client.post(f"/api/v1/peer/connection-reports/{report_id}/triage", headers={"Authorization": f"Bearer {moderator_token}"}, json={"severity": "high", "assigned_to_role": "administrator", "assigned_to_id": "administrator"})
        assert spoofed_assignment.status_code == 403
        triaged = client.post(f"/api/v1/peer/connection-reports/{report_id}/triage", headers={"Authorization": f"Bearer {moderator_token}"}, json={"severity": "critical", "assigned_to_role": "moderator", "assigned_to_id": "moderator"})
        assert triaged.status_code == 200
        assert triaged.json()["status"] == "triaged"
        assert "not Cornell University" in triaged.json()["emergency_boundaries"]["independence"]
        pii_note = client.post(f"/api/v1/peer/connection-reports/{report_id}/notes", headers={"Authorization": f"Bearer {moderator_token}"}, json={"note": "Copy their contact address student@cornell.edu into the case note."})
        assert pii_note.status_code == 422
        note = client.post(f"/api/v1/peer/connection-reports/{report_id}/notes", headers={"Authorization": f"Bearer {moderator_token}"}, json={"note": "Reviewed the report and preserved only information needed for the safety decision."})
        assert note.status_code == 201
        stored_note = db.tables["peer_moderation_notes"][0]
        assert "Reviewed the report" not in stored_note.note_encrypted
        detail = client.get(f"/api/v1/peer/connection-reports/{report_id}", headers={"Authorization": f"Bearer {moderator_token}"})
        assert detail.status_code == 200
        assert detail.json()["reason"].startswith("The supporter")
        assert "reporter_id" not in detail.json() and "target_id" not in detail.json()
        assert "@cornell.edu" not in detail.text and "+1607" not in detail.text
        resolved = client.post(f"/api/v1/peer/connection-reports/{report_id}/resolve", headers={"Authorization": f"Bearer {moderator_token}"}, json={"outcome": "resolved", "resolution_code": "documented_guidance", "summary": "Documented the boundary concern and completed the assigned review."})
        assert resolved.status_code == 200
        assert resolved.json()["status"] == "resolved"
        second_resolution = client.post(f"/api/v1/peer/connection-reports/{report_id}/resolve", headers={"Authorization": f"Bearer {moderator_token}"}, json={"outcome": "resolved", "resolution_code": "no_action", "summary": "Attempted an unauthorized duplicate resolution action."})
        assert second_resolution.status_code == 409


def test_duplicate_reports_spoofed_participants_and_requester_blocking(lifecycle):
    app, db, requester_id, supporter_id = lifecycle
    with TestClient(app) as client:
        request_id, requester_token, _ = _create_accepted_connection(client, requester_id, supporter_id)
        payload = {"reason": "A detailed concern that should exist only once while under review."}
        first = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {requester_token}"}, json=payload)
        duplicate = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {requester_token}"}, json=payload)
        assert first.status_code == 201 and duplicate.status_code == 409
        spoofed_token = create_peer_token("requester", str(uuid.uuid4()))
        spoofed = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {spoofed_token}"}, json=payload)
        assert spoofed.status_code == 403
        blocked = client.post(f"/api/v1/peer-requests/{request_id}/block", headers={"Authorization": f"Bearer {requester_token}"}, json={"reason_code": "unwanted_contact"})
        assert blocked.status_code == 201
        assert db.tables["peer_blocks"][0].created_by_role == "requester"
        duplicate_block = client.post(f"/api/v1/peer-requests/{request_id}/block", headers={"Authorization": f"Bearer {requester_token}"}, json={"reason_code": "unwanted_contact"})
        assert duplicate_block.status_code == 409


def test_notification_failure_is_recorded_without_claiming_delivery(lifecycle, monkeypatch):
    app, db, requester_id, supporter_id = lifecycle
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-provider-key")

    def provider_failure(_payload, _options=None):
        raise RuntimeError("provider unavailable")

    monkeypatch.setattr(peer.resend.Emails, "send", provider_failure)
    with TestClient(app) as client:
        request_id, requester_token, _ = _create_accepted_connection(client, requester_id, supporter_id)
        response = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {requester_token}"}, json={"reason": "A detailed report submitted while the notification provider is unavailable."})
    assert response.status_code == 201
    assert response.json()["notification"]["status"] == "failed"
    notification = db.tables["peer_notifications"][-1]
    assert notification.status == "failed"
    assert notification.last_error_code == "provider_request_failed"
    assert "provider unavailable" not in str(notification.last_error_code)
    moderator_token = create_peer_token("moderator", "moderator")
    with TestClient(app) as client:
        status_response = client.get(f"/api/v1/peer/notifications/{notification.notification_id}", headers={"Authorization": f"Bearer {moderator_token}"})
    assert status_response.status_code == 200
    assert status_response.json()["status"] == "failed"


def test_notification_provider_acceptance_is_not_reported_as_delivery(lifecycle, monkeypatch):
    app, _db, requester_id, supporter_id = lifecycle
    monkeypatch.setattr(settings, "RESEND_API_KEY", "test-provider-key")
    monkeypatch.setattr(peer.resend.Emails, "send", lambda _payload, _options=None: {"id": "provider-message-123"})
    with TestClient(app) as client:
        request_id, requester_token, _ = _create_accepted_connection(client, requester_id, supporter_id)
        response = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {requester_token}"}, json={"reason": "A detailed safety report requiring an operator notification."})
    notification = response.json()["notification"]
    assert notification["status"] == "provider_accepted"
    assert "delivery is not confirmed" in notification["meaning"].lower()
    assert "delivered" not in notification["status"]


def test_feature_flag_readiness_gate_blocks_missing_approvals(lifecycle, monkeypatch):
    app, _db, requester_id, supporter_id = lifecycle
    monkeypatch.setattr(settings, "PEER_SAFETY_APPROVAL_ID", "")
    requester_token = create_peer_token("requester", str(requester_id))
    admin_token = create_peer_token("administrator", "administrator")
    with TestClient(app) as client:
        blocked = client.post("/api/v1/peer-connect", headers={"Authorization": f"Bearer {requester_token}"}, json={"supporter_id": str(supporter_id), "location_id": "duffield_atrium", "meeting_window_id": "weekday_daytime", "requester_consent": True})
        readiness = client.get("/api/v1/peer/readiness", headers={"Authorization": f"Bearer {admin_token}"})
    assert blocked.status_code == 503
    assert readiness.status_code == 200
    assert readiness.json()["ready"] is False
    assert "safety approval" in readiness.json()["blockers"]


def test_requester_suspension_reinstatement_and_authorization_boundaries(lifecycle):
    app, _db, requester_id, supporter_id = lifecycle
    moderator_token = create_peer_token("moderator", "moderator")
    admin_token = create_peer_token("administrator", "administrator")
    with TestClient(app) as client:
        request_id, _, _ = _create_accepted_connection(client, requester_id, supporter_id)
        suspended = client.post(f"/api/v1/peer/safety/subjects/requester/{requester_id}/status", headers={"Authorization": f"Bearer {moderator_token}"}, json={"action": "suspend", "reason_code": "active_safety_review"})
        assert suspended.status_code == 200
        assert suspended.json()["status"] == "suspended"
        moderator_reinstate = client.post(f"/api/v1/peer/safety/subjects/requester/{requester_id}/status", headers={"Authorization": f"Bearer {moderator_token}"}, json={"action": "reinstate", "reason_code": "resolved_review"})
        assert moderator_reinstate.status_code == 403
        reinstated = client.post(f"/api/v1/peer/safety/subjects/requester/{requester_id}/status", headers={"Authorization": f"Bearer {admin_token}"}, json={"action": "reinstate", "reason_code": "resolved_review"})
        assert reinstated.status_code == 200
        assert reinstated.json()["status"] == "active"
        messages = client.get(f"/api/v1/peer-requests/{request_id}/messages", headers={"Authorization": f"Bearer {moderator_token}"})
        assert messages.status_code == 403


def test_active_connection_and_report_deletion_are_blocked_until_terminal(lifecycle):
    app, _db, requester_id, supporter_id = lifecycle
    admin_token = create_peer_token("administrator", "administrator")
    with TestClient(app) as client:
        request_id, requester_token, _ = _create_accepted_connection(client, requester_id, supporter_id)
        active_delete = client.delete(f"/api/v1/peer-requests/{request_id}", headers={"Authorization": f"Bearer {admin_token}"})
        assert active_delete.status_code == 409
        submitted = client.post(f"/api/v1/peer-requests/{request_id}/report", headers={"Authorization": f"Bearer {requester_token}"}, json={"reason": "A detailed report that must be resolved before deletion."})
        report_id = submitted.json()["connection_report_id"]
        active_report_delete = client.delete(f"/api/v1/peer/connection-reports/{report_id}", headers={"Authorization": f"Bearer {admin_token}"})
        assert active_report_delete.status_code == 409
        triaged = client.post(f"/api/v1/peer/connection-reports/{report_id}/triage", headers={"Authorization": f"Bearer {admin_token}"}, json={"severity": "moderate", "assigned_to_role": "administrator", "assigned_to_id": "administrator"})
        assert triaged.status_code == 200
        resolved = client.post(f"/api/v1/peer/connection-reports/{report_id}/resolve", headers={"Authorization": f"Bearer {admin_token}"}, json={"outcome": "resolved", "resolution_code": "no_action", "summary": "Reviewed the report and documented that no further action was supported."})
        assert resolved.status_code == 200
        deleted_report = client.delete(f"/api/v1/peer/connection-reports/{report_id}", headers={"Authorization": f"Bearer {admin_token}"})
        assert deleted_report.status_code == 200
