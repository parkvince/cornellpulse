import re
import uuid
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import new as hmac_new
from secrets import token_urlsafe
from typing import Literal

import resend
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    PeerPrincipal,
    authorize_self_or_staff,
    create_peer_token,
    require_peer_actor,
    require_peer_administrator,
    require_peer_staff,
    require_requester,
    require_supporter,
)
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
    RateLimitBucket,
    SupporterReferenceInvitation,
    SupporterReport,
)
from app.services.peer_security import (
    decrypt_private_data,
    email_html,
    encrypt_private_data,
    hash_peer_password,
    public_supporter_dict,
    verify_peer_password,
)
from app.services.rate_limits import enforce_persistent_rate_limit
from app.services.peer_readiness import peer_readiness_blockers, peer_readiness_status
from app.services.peer_safety import (
    EMERGENCY_BOUNDARIES,
    REPORT_SEVERITIES,
    RESOLUTION_CODES,
    report_transition_allowed,
)
from app.services.connection_flow import (
    CONNECTION_STATES,
    PUBLIC_MEETING_LOCATIONS,
    PUBLIC_MEETING_LOCATION_IDS,
    PUBLIC_MEETING_SAFETY_NOTE,
    SAFE_MEETING_WINDOWS,
    SAFE_MEETING_WINDOW_IDS,
    contains_contact_details,
    public_meeting_location,
    safe_meeting_window,
    transition_allowed as connection_transition_allowed,
)
from app.services.supporter_onboarding import (
    SUPPORTER_APPLICATION_STATES,
    SUPPORTER_POLICY,
    SUPPORTER_POLICY_VERSION,
    SUPPORTER_TRAINING_MODULES,
    SUPPORTER_TRAINING_VERSION,
    transition_allowed,
)


router = APIRouter()
FROM_EMAIL = "CornellPulse <onboarding@resend.dev>"
EMAIL_RE = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$")
PHONE_RE = re.compile(r"^\+?[1-9][0-9]{7,14}$")
CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
AUDIT_METADATA_KEYS = {"supporter_id", "requester_id", "invitation_id", "from", "to", "reason_code", "action", "supporters", "requesters", "requests", "reports", "messages", "blocks", "connection_reports", "moderation_notes", "notifications", "reference_invitations", "audit_logs", "status_history", "rate_limit_buckets"}


def require_peer_connect() -> None:
    if not settings.FEATURE_PEER_CONNECT:
        raise HTTPException(status_code=503, detail="Peer Connect is unavailable pending safety review.")
    if peer_readiness_blockers():
        raise HTTPException(status_code=503, detail="Peer Connect cannot start because the launch-readiness gate is incomplete.")


def require_supporter_signup() -> None:
    if not settings.FEATURE_SUPPORTER_SIGNUP:
        raise HTTPException(status_code=503, detail="Supporter signup is unavailable pending safety review.")


def require_peer_workflow() -> None:
    if not settings.FEATURE_PEER_CONNECT and not settings.FEATURE_SUPPORTER_SIGNUP:
        raise HTTPException(status_code=503, detail="Peer workflows are unavailable pending safety review.")


def _safe_text(value: str, label: str) -> str:
    if CONTROL_RE.search(value) or "<" in value or ">" in value or "\r" in value or "\n" in value:
        raise ValueError(f"{label} contains unsupported markup or control characters")
    return value


def _email(value: str) -> str:
    normalized = value.strip().lower()
    if len(normalized) > 254 or not EMAIL_RE.fullmatch(normalized):
        raise ValueError("Enter a valid email address")
    return normalized


def _phone(value: str) -> str:
    normalized = re.sub(r"[\s().-]", "", value)
    if not PHONE_RE.fullmatch(normalized):
        raise ValueError("Enter a valid international or US phone number")
    return normalized


class StrictPeerModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class SupporterSignupRequest(StrictPeerModel):
    display_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    phone: str = Field(min_length=8, max_length=32)
    password: str = Field(min_length=12, max_length=128)
    year: str = Field(min_length=1, max_length=40)
    major: str | None = Field(default=None, max_length=120)
    locations: list[str] = Field(min_length=1, max_length=5)
    availability: list[str] = Field(default_factory=list, max_length=10)
    interests: list[str] = Field(default_factory=list, max_length=10)
    about: str | None = Field(default=None, max_length=500)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = _email(value)
        if not normalized.endswith("@cornell.edu"):
            raise ValueError("A Cornell email is required for contact; email-domain validation is not identity verification")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return _phone(value)

    @field_validator("display_name", "year", "major", "about")
    @classmethod
    def validate_text(cls, value: str | None, info) -> str | None:
        return _safe_text(value, info.field_name) if value is not None else None

    @field_validator("locations", "availability", "interests")
    @classmethod
    def validate_list(cls, values: list[str], info) -> list[str]:
        if any(not isinstance(item, str) or not item.strip() or len(item.strip()) > 80 for item in values):
            raise ValueError(f"{info.field_name} items must contain 1 to 80 characters")
        cleaned = [_safe_text(item.strip(), info.field_name) for item in values]
        if len(set(item.casefold() for item in cleaned)) != len(cleaned):
            raise ValueError(f"{info.field_name} cannot contain duplicates")
        return cleaned


class SupporterPolicyAcceptanceRequest(StrictPeerModel):
    policy_version: str = Field(min_length=1, max_length=32)
    role_scope_accepted: Literal[True]
    conduct_standards_accepted: Literal[True]
    crisis_boundaries_accepted: Literal[True]
    public_meeting_rules_accepted: Literal[True]
    reporting_policy_accepted: Literal[True]
    withdrawal_controls_acknowledged: Literal[True]

    @field_validator("policy_version")
    @classmethod
    def validate_policy_version(cls, value: str) -> str:
        if value != SUPPORTER_POLICY_VERSION:
            raise ValueError("The current supporter policy must be reviewed and accepted")
        return value


class SupporterTransitionRequest(StrictPeerModel):
    target_status: Literal["identity_pending", "reference_pending", "training_pending", "review", "approved", "suspended", "rejected"]
    reason_code: Literal["requirements_complete", "application_incomplete", "policy_violation", "safety_review", "administrative_review", "supporter_request"] = "administrative_review"


class IdentityVerificationEvidenceRequest(StrictPeerModel):
    verification_reference: str = Field(min_length=8, max_length=128)

    @field_validator("verification_reference")
    @classmethod
    def validate_reference(cls, value: str) -> str:
        return _safe_text(value, "verification_reference")


class ReferenceInvitationRequest(StrictPeerModel):
    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return _email(value)


class ReferenceDecisionRequest(StrictPeerModel):
    token: str = Field(min_length=32, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")
    consent: bool
    relationship: str | None = Field(default=None, max_length=100)
    statement: str | None = Field(default=None, max_length=500)

    @field_validator("relationship", "statement")
    @classmethod
    def validate_text(cls, value: str | None, info) -> str | None:
        return _safe_text(value, info.field_name) if value is not None else None

    @model_validator(mode="after")
    def validate_decision(self):
        if self.consent and (not self.relationship or len(self.relationship) < 2 or not self.statement or len(self.statement) < 20):
            raise ValueError("Consent, relationship, and a 20-character statement are required to provide a reference")
        if not self.consent and (self.relationship is not None or self.statement is not None):
            raise ValueError("A declined invitation cannot include reference content")
        return self


class TrainingCompletionRequest(StrictPeerModel):
    requirements_version: str = Field(min_length=1, max_length=32)
    completed_modules: list[str] = Field(min_length=len(SUPPORTER_TRAINING_MODULES), max_length=len(SUPPORTER_TRAINING_MODULES))
    evidence_reference: str = Field(min_length=8, max_length=128)

    @field_validator("requirements_version")
    @classmethod
    def validate_version(cls, value: str) -> str:
        if value != SUPPORTER_TRAINING_VERSION:
            raise ValueError("The current training requirements must be completed")
        return value

    @field_validator("completed_modules")
    @classmethod
    def validate_modules(cls, values: list[str]) -> list[str]:
        if len(values) != len(set(values)) or set(values) != set(SUPPORTER_TRAINING_MODULES):
            raise ValueError("Every current training requirement must be completed exactly once")
        return list(SUPPORTER_TRAINING_MODULES)

    @field_validator("evidence_reference")
    @classmethod
    def validate_evidence(cls, value: str) -> str:
        return _safe_text(value, "evidence_reference")


class RequesterRegistrationRequest(StrictPeerModel):
    display_name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=254)
    phone: str | None = Field(default=None, min_length=8, max_length=32)
    password: str = Field(min_length=12, max_length=128)

    @field_validator("display_name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return _safe_text(value, "display_name")

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = _email(value)
        if not normalized.endswith("@cornell.edu"):
            raise ValueError("A Cornell email is required for contact; email-domain validation is not identity verification")
        return normalized

    @field_validator("phone")
    @classmethod
    def validate_optional_phone(cls, value: str | None) -> str | None:
        return _phone(value) if value else None


class PeerLoginRequest(StrictPeerModel):
    role: Literal["supporter", "requester", "moderator"]
    subject_id: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class ConnectRequest(StrictPeerModel):
    supporter_id: uuid.UUID
    location_id: str = Field(min_length=1, max_length=64)
    meeting_window_id: str = Field(min_length=1, max_length=64)
    requester_consent: Literal[True]
    message: str | None = Field(default=None, max_length=500)

    @field_validator("location_id")
    @classmethod
    def validate_location(cls, value: str) -> str:
        if value not in PUBLIC_MEETING_LOCATION_IDS:
            raise ValueError("Choose an approved public meeting location")
        return value

    @field_validator("meeting_window_id")
    @classmethod
    def validate_window(cls, value: str) -> str:
        if value not in SAFE_MEETING_WINDOW_IDS:
            raise ValueError("Choose an approved daytime or early-evening meeting window")
        return value

    @field_validator("message")
    @classmethod
    def validate_message(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = _safe_text(value, "message")
        if contains_contact_details(value):
            raise ValueError("Do not include phone numbers, email addresses, links, or social handles; use the in-app relay")
        return value


class ReportRequest(StrictPeerModel):
    supporter_id: uuid.UUID
    reason: str = Field(min_length=10, max_length=500)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        return _safe_text(value, "reason")


class StatusRequest(StrictPeerModel):
    status: Literal["accepted", "declined", "expired", "unavailable", "canceled", "blocked"]


class SupporterConnectionActionRequest(StrictPeerModel):
    action: Literal["accept", "decline", "expire", "block"]


class RelayMessageRequest(StrictPeerModel):
    body: str = Field(min_length=1, max_length=1000)

    @field_validator("body")
    @classmethod
    def validate_body(cls, value: str) -> str:
        value = _safe_text(value, "body")
        if contains_contact_details(value):
            raise ValueError("Do not include phone numbers, email addresses, links, or social handles; use the in-app relay")
        return value


class ConnectionSafetyReportRequest(StrictPeerModel):
    reason: str = Field(min_length=10, max_length=500)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        return _safe_text(value, "reason")


class ReportTriageRequest(StrictPeerModel):
    severity: Literal["low", "moderate", "high", "critical"]
    assigned_to_role: Literal["moderator", "administrator"]
    assigned_to_id: str = Field(min_length=1, max_length=64)

    @field_validator("assigned_to_id")
    @classmethod
    def validate_assignee(cls, value: str) -> str:
        return _safe_text(value, "assigned_to_id")

    @model_validator(mode="after")
    def validate_known_assignee(self):
        expected = "moderator" if self.assigned_to_role == "moderator" else "administrator"
        if self.assigned_to_id != expected:
            raise ValueError("The assignee must be a configured staff identity")
        return self


class ModerationNoteRequest(StrictPeerModel):
    note: str = Field(min_length=10, max_length=1000)

    @field_validator("note")
    @classmethod
    def validate_note(cls, value: str) -> str:
        value = _safe_text(value, "note")
        if contains_contact_details(value):
            raise ValueError("Do not copy phone numbers, email addresses, links, or social handles into moderation notes")
        return value


class ReportResolutionRequest(StrictPeerModel):
    outcome: Literal["resolved", "dismissed", "duplicate"]
    resolution_code: Literal[
        "no_action", "documented_guidance", "participant_blocked", "account_suspended",
        "account_reinstated", "duplicate_report", "unable_to_investigate", "operator_emergency_escalation",
    ]
    summary: str = Field(min_length=10, max_length=1000)
    duplicate_of: uuid.UUID | None = None

    @field_validator("summary")
    @classmethod
    def validate_summary(cls, value: str) -> str:
        value = _safe_text(value, "summary")
        if contains_contact_details(value):
            raise ValueError("Do not copy phone numbers, email addresses, links, or social handles into resolution summaries")
        return value

    @model_validator(mode="after")
    def validate_duplicate(self):
        if (self.outcome == "duplicate") is not (self.duplicate_of is not None):
            raise ValueError("duplicate_of is required only for duplicate outcomes")
        if self.outcome == "duplicate" and self.resolution_code != "duplicate_report":
            raise ValueError("Duplicate outcomes require the duplicate_report resolution code")
        return self


class ParticipantBlockRequest(StrictPeerModel):
    reason_code: Literal["participant_safety_choice", "unwanted_contact", "boundary_violation", "safety_concern"] = "participant_safety_choice"


class SubjectSafetyActionRequest(StrictPeerModel):
    action: Literal["suspend", "reinstate"]
    reason_code: Literal["active_safety_review", "policy_violation", "resolved_review", "administrative_correction"]


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _expires(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def _send_email(to: str, template: Literal["application", "approval", "connection", "report"], record_id: str) -> dict[str, str | None]:
    if not settings.RESEND_API_KEY or not to or not EMAIL_RE.fullmatch(to) or "\r" in to or "\n" in to:
        return {"status": "skipped", "provider_message_id": None, "error_code": "not_configured_or_invalid_recipient"}
    subject_by_template = {
        "application": "New CornellPulse supporter application",
        "approval": "CornellPulse supporter application update",
        "connection": "New CornellPulse peer connection request",
        "report": "New CornellPulse peer safety report",
    }
    body = f"<p>A CornellPulse peer workflow record requires attention.</p><p>Reference: <code>{email_html(record_id)}</code></p>"
    try:
        resend.api_key = settings.RESEND_API_KEY
        response = resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": subject_by_template[template], "html": body})
        provider_id = response.get("id") if isinstance(response, dict) else getattr(response, "id", None)
        if not provider_id:
            return {"status": "failed", "provider_message_id": None, "error_code": "provider_response_unconfirmed"}
        return {"status": "provider_accepted", "provider_message_id": str(provider_id)[:128], "error_code": None}
    except Exception:
        # Do not log recipient addresses, provider payloads, or user content.
        return {"status": "failed", "provider_message_id": None, "error_code": "provider_request_failed"}


def _record_notification(db: AsyncSession, event_type: str, target_type: str, target_id: str, recipient_role: str, recipient_id: str, attempt: dict[str, str | None]) -> PeerNotification:
    notification = PeerNotification(
        notification_id=uuid.uuid4(),
        event_type=event_type,
        target_type=target_type,
        target_id=target_id,
        recipient_role=recipient_role,
        recipient_id=recipient_id,
        channel="email",
        status=str(attempt["status"]),
        attempt_count=0 if attempt["status"] == "skipped" else 1,
        provider_message_id=attempt.get("provider_message_id"),
        last_error_code=attempt.get("error_code"),
        attempted_at=datetime.now(timezone.utc) if attempt["status"] != "skipped" else None,
        retention_expires_at=_expires(settings.PEER_NOTIFICATION_RETENTION_DAYS),
    )
    db.add(notification)
    return notification


def _notification_summary(notification: PeerNotification) -> dict:
    return {
        "notification_id": str(notification.notification_id),
        "channel": notification.channel,
        "status": notification.status,
        "meaning": {
            "provider_accepted": "The email provider accepted the request; delivery is not confirmed.",
            "failed": "The provider did not confirm acceptance.",
            "skipped": "No delivery attempt was made.",
            "pending": "A delivery attempt has not completed.",
        }.get(notification.status, "Delivery is not confirmed."),
    }


def _send_reference_invitation(to: str, token: str) -> None:
    if not settings.RESEND_API_KEY or not EMAIL_RE.fullmatch(to) or "\r" in to or "\n" in to:
        return
    # URL fragments are not sent in HTTP requests, reducing capability-token exposure in access logs.
    invitation_url = f"{settings.FRONTEND_URL.rstrip('/')}/peer/reference#token={token}"
    body = (
        "<p>You were invited to provide a CornellPulse supporter reference.</p>"
        "<p>Opening the invitation does not imply consent. You may decline without providing any reference content.</p>"
        f'<p><a href="{email_html(invitation_url)}">Review the consent request</a></p>'
    )
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": "CornellPulse reference consent invitation", "html": body})
    except Exception:
        # Do not log invitation tokens, recipient addresses, or provider payloads.
        return


def _audit(db: AsyncSession, actor: PeerPrincipal, action: str, target_type: str, target_id: str, metadata: dict | None = None) -> None:
    safe_metadata = {
        key: value
        for key, value in (metadata or {}).items()
        if key in AUDIT_METADATA_KEYS and isinstance(value, (str, int, bool)) and (not isinstance(value, str) or len(value) <= 64)
    }
    db.add(PeerAuditLog(
        actor_role=actor.role,
        actor_id=actor.subject_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        event_metadata=safe_metadata,
        retention_expires_at=_expires(settings.PEER_AUDIT_RETENTION_DAYS),
    ))


def _audit_reference(db: AsyncSession, action: str, invitation: SupporterReferenceInvitation) -> None:
    db.add(PeerAuditLog(
        actor_role="reference",
        actor_id=str(invitation.invitation_id),
        action=action,
        target_type="reference_invitation",
        target_id=str(invitation.invitation_id),
        event_metadata={"supporter_id": str(invitation.supporter_id), "invitation_id": str(invitation.invitation_id)},
        retention_expires_at=_expires(settings.PEER_AUDIT_RETENTION_DAYS),
    ))


def _status_history(db: AsyncSession, actor: PeerPrincipal, entity_type: str, entity_id: str, previous: str | None, new: str) -> None:
    db.add(PeerStatusHistory(
        entity_type=entity_type,
        entity_id=entity_id,
        previous_status=previous,
        new_status=new,
        actor_role=actor.role,
        actor_id=actor.subject_id,
        retention_expires_at=_expires(settings.PEER_AUDIT_RETENTION_DAYS),
    ))


def _supporter_private(supporter: PeerSignup) -> dict:
    return decrypt_private_data(supporter.private_data_encrypted) if supporter.private_data_encrypted else {
        "email": supporter.email,
        "phone": supporter.phone,
        "reference_name": supporter.ref_name,
        "reference_phone": supporter.ref_phone,
        "reference_email": supporter.ref_email,
        "reference_relationship": supporter.ref_relationship,
    }


def _protected_hash(scope: str, value: str) -> str:
    key = (settings.PEER_AUTH_SECRET or settings.ADMIN_SESSION_SECRET or "development-peer-key").encode("utf-8")
    return hmac_new(key, f"{scope}:{value}".encode("utf-8"), sha256).hexdigest()


async def _reference_requirement_complete(db: AsyncSession, supporter_id: uuid.UUID) -> bool:
    result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.supporter_id == supporter_id,
        SupporterReferenceInvitation.status == "accepted",
        SupporterReferenceInvitation.consented_at.is_not(None),
        SupporterReferenceInvitation.deleted_at.is_(None),
    ))
    return result.scalar_one_or_none() is not None


async def _supporter_readiness_errors(db: AsyncSession, supporter: PeerSignup) -> list[str]:
    errors: list[str] = []
    if supporter.policy_version != SUPPORTER_POLICY_VERSION or not supporter.policy_accepted_at:
        errors.append("current supporter policy acceptance")
    if not supporter.identity_verified_at or not supporter.identity_subject_hash:
        errors.append("Cornell identity verification")
    if settings.is_production and supporter.identity_verification_method != "cornell_oidc":
        errors.append("production Cornell OIDC verification")
    if not await _reference_requirement_complete(db, supporter.supporter_id):
        errors.append("consented reference response")
    if (
        supporter.training_requirements_version != SUPPORTER_TRAINING_VERSION
        or not supporter.training_completed_at
        or not supporter.training_evidence_hash
        or set(supporter.training_modules_completed or []) != set(SUPPORTER_TRAINING_MODULES)
    ):
        errors.append("current training requirements")
    return errors


async def _transition_supporter(
    db: AsyncSession,
    supporter: PeerSignup,
    actor: PeerPrincipal,
    target: str,
    reason_code: str,
) -> None:
    current = supporter.status
    if not transition_allowed(current, target):
        raise HTTPException(status_code=409, detail=f"Supporter application cannot move from {current} to {target}.")
    if actor.role == "moderator" and not (current == "approved" and target == "suspended"):
        raise HTTPException(status_code=403, detail="Moderators may suspend an approved supporter but cannot advance or reject applications.")
    if actor.role not in {"moderator", "administrator"}:
        raise HTTPException(status_code=403, detail="Staff authorization required for this transition.")

    if target == "reference_pending" and (not supporter.identity_verified_at or not supporter.identity_subject_hash):
        raise HTTPException(status_code=409, detail="Cornell identity verification is required before requesting a reference.")
    if target == "training_pending" and not await _reference_requirement_complete(db, supporter.supporter_id):
        raise HTTPException(status_code=409, detail="A consented reference response is required before training review.")
    if target == "review":
        training_ready = (
            supporter.training_requirements_version == SUPPORTER_TRAINING_VERSION
            and supporter.training_completed_at
            and supporter.training_evidence_hash
            and set(supporter.training_modules_completed or []) == set(SUPPORTER_TRAINING_MODULES)
        )
        if not training_ready:
            raise HTTPException(status_code=409, detail="Every current training requirement must be completed before review.")
    if target == "approved":
        errors = await _supporter_readiness_errors(db, supporter)
        if errors:
            raise HTTPException(status_code=409, detail="Approval requirements incomplete: " + ", ".join(errors) + ".")

    now = datetime.now(timezone.utc)
    supporter.status = target
    supporter.approved = target == "approved"
    if target == "approved":
        supporter.approved_at = now
        supporter.suspended_at = None
    elif target == "suspended":
        supporter.suspended_at = now
        connection_result = await db.execute(select(PeerConnectRequest).where(
            PeerConnectRequest.supporter_id == supporter.supporter_id,
            PeerConnectRequest.status.in_(["pending", "accepted"]),
            PeerConnectRequest.deleted_at.is_(None),
        ))
        for connection in connection_result.scalars().all():
            await _transition_connection(db, connection, actor, "unavailable")
    elif target == "rejected":
        supporter.rejected_at = now
    _status_history(db, actor, "supporter", str(supporter.supporter_id), current, target)
    _audit(db, actor, "supporter.status_changed", "supporter", str(supporter.supporter_id), {"from": current, "to": target, "reason_code": reason_code})


async def _active_requester(db: AsyncSession, requester_id: uuid.UUID) -> PeerRequester:
    result = await db.execute(select(PeerRequester).where(
        PeerRequester.requester_id == requester_id,
        PeerRequester.status == "active",
        PeerRequester.deleted_at.is_(None),
        PeerRequester.withdrawn_at.is_(None),
        PeerRequester.retention_expires_at > datetime.now(timezone.utc),
    ))
    requester = result.scalar_one_or_none()
    if not requester:
        raise HTTPException(status_code=403, detail="Requester account is no longer active.")
    return requester


async def _active_supporter(db: AsyncSession, supporter_id: uuid.UUID, *, approved: bool) -> PeerSignup:
    allowed_statuses = ["approved"] if approved else [
        "draft", "submitted", "identity_pending", "reference_pending",
        "training_pending", "review", "approved", "suspended",
    ]
    result = await db.execute(select(PeerSignup).where(
        PeerSignup.supporter_id == supporter_id,
        PeerSignup.status.in_(allowed_statuses),
        PeerSignup.deleted_at.is_(None),
        PeerSignup.withdrawn_at.is_(None),
        PeerSignup.retention_expires_at > datetime.now(timezone.utc),
    ))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=403, detail="Supporter account is no longer active.")
    return supporter


def _identity_is_verified(record: PeerRequester | PeerSignup) -> bool:
    if not record.identity_verified_at or not record.identity_subject_hash:
        return False
    return not settings.is_production or record.identity_verification_method == "cornell_oidc"


async def _verified_requester(db: AsyncSession, requester_id: uuid.UUID) -> PeerRequester:
    requester = await _active_requester(db, requester_id)
    if not _identity_is_verified(requester):
        raise HTTPException(status_code=403, detail="Verified Cornell identity is required for connection requests.")
    return requester


async def _verified_supporter(db: AsyncSession, supporter_id: uuid.UUID) -> PeerSignup:
    supporter = await _active_supporter(db, supporter_id, approved=True)
    if not _identity_is_verified(supporter):
        raise HTTPException(status_code=403, detail="The supporter is unavailable because Cornell identity verification is incomplete.")
    return supporter


def _connection_details(connection: PeerConnectRequest) -> dict:
    private = decrypt_private_data(connection.private_data_encrypted) if connection.private_data_encrypted else {}
    location_id = private.get("location_id")
    meeting_window_id = private.get("meeting_window_id")
    return {
        "location": public_meeting_location(location_id) if isinstance(location_id, str) else None,
        "meeting_window": safe_meeting_window(meeting_window_id) if isinstance(meeting_window_id, str) else None,
        "message": private.get("message") if isinstance(private.get("message"), str) else None,
    }


def _connection_summary(connection: PeerConnectRequest, *, include_details: bool) -> dict:
    summary = {
        "request_id": str(connection.request_id),
        "supporter_id": str(connection.supporter_id),
        "requester_id": str(connection.requester_id),
        "status": connection.status,
        "requested_at": connection.requested_at.isoformat() if connection.requested_at else None,
        "expires_at": connection.expires_at.isoformat() if connection.expires_at else None,
        "requester_consented": bool(connection.requester_consented_at),
        "supporter_consented": bool(connection.supporter_consented_at),
        "relay_available": connection.status == "accepted" and bool(connection.requester_consented_at and connection.supporter_consented_at),
    }
    if include_details:
        summary["request"] = _connection_details(connection)
    return summary


async def _expire_connection_if_needed(db: AsyncSession, connection: PeerConnectRequest) -> bool:
    if connection.status != "pending" or not connection.expires_at:
        return False
    expires_at = connection.expires_at if connection.expires_at.tzinfo else connection.expires_at.replace(tzinfo=timezone.utc)
    if expires_at > datetime.now(timezone.utc):
        return False
    previous = connection.status
    connection.status = "expired"
    system_actor = PeerPrincipal("system", "administrator")
    _status_history(db, system_actor, "connection_request", str(connection.request_id), previous, "expired")
    _audit(db, system_actor, "connection.expired", "connection_request", str(connection.request_id), {"from": previous, "to": "expired"})
    return True


def _assert_connection_participant(connection: PeerConnectRequest, actor: PeerPrincipal) -> None:
    if actor.role == "requester" and str(connection.requester_id) == actor.subject_id:
        return
    if actor.role == "supporter" and str(connection.supporter_id) == actor.subject_id:
        return
    raise HTTPException(status_code=403, detail="You are not a participant in this connection request.")


async def _transition_connection(db: AsyncSession, connection: PeerConnectRequest, actor: PeerPrincipal, target: str) -> None:
    await _expire_connection_if_needed(db, connection)
    current = connection.status
    if not connection_transition_allowed(current, target):
        raise HTTPException(status_code=409, detail=f"Connection request cannot move from {current} to {target}.")
    now = datetime.now(timezone.utc)
    connection.status = target
    if target == "accepted":
        connection.supporter_consented_at = now
    elif target == "declined":
        connection.declined_at = now
    elif target == "canceled":
        connection.canceled_at = now
    elif target == "blocked":
        connection.blocked_at = now
    elif target == "unavailable":
        connection.unavailable_at = now
    _status_history(db, actor, "connection_request", str(connection.request_id), current, target)
    _audit(db, actor, "connection.status_changed", "connection_request", str(connection.request_id), {"from": current, "to": target})


async def _create_participant_block(db: AsyncSession, connection: PeerConnectRequest, actor: PeerPrincipal, reason_code: str) -> PeerBlock:
    _assert_connection_participant(connection, actor)
    if actor.role not in {"supporter", "requester"}:
        raise HTTPException(status_code=403, detail="Only connection participants may block the other participant.")
    existing_result = await db.execute(select(PeerBlock).where(
        PeerBlock.supporter_id == connection.supporter_id,
        PeerBlock.requester_id == connection.requester_id,
        PeerBlock.active.is_(True),
        PeerBlock.deleted_at.is_(None),
    ))
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A block is already active for this participant pair.")
    if connection.status in {"pending", "accepted"}:
        await _transition_connection(db, connection, actor, "blocked")
    block = PeerBlock(
        block_id=uuid.uuid4(),
        supporter_id=connection.supporter_id,
        requester_id=connection.requester_id,
        created_by_role=actor.role,
        created_by_id=uuid.UUID(actor.subject_id),
        reason_code=reason_code,
        retention_expires_at=_expires(settings.PEER_BLOCK_RETENTION_DAYS),
    )
    db.add(block)
    _audit(db, actor, "connection.block.created", "connection_request", str(connection.request_id), {"reason_code": reason_code})
    return block


@router.get("/peer/supporter-policy", dependencies=[Depends(require_supporter_signup)])
async def get_supporter_policy():
    return SUPPORTER_POLICY


@router.get("/peer/safety-boundaries", dependencies=[Depends(require_peer_connect)])
async def get_peer_safety_boundaries():
    return EMERGENCY_BOUNDARIES


@router.get("/peer/readiness")
async def get_peer_readiness(actor: PeerPrincipal = Depends(require_peer_administrator)):
    _ = actor
    return peer_readiness_status()


@router.post("/peer-signup", dependencies=[Depends(require_supporter_signup)], status_code=201)
async def peer_signup(payload: SupporterSignupRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "supporter-signup", _client_ip(request), 3, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    supporter_id = uuid.uuid4()
    supporter = PeerSignup(
        supporter_id=supporter_id,
        name=payload.display_name,
        year=payload.year,
        major=payload.major,
        locations=payload.locations,
        availability=payload.availability,
        interests=payload.interests,
        about=payload.about,
        approved=False,
        status="draft",
        credential_hash=hash_peer_password(payload.password),
        private_data_encrypted=encrypt_private_data({
            "email": payload.email,
            "phone": payload.phone,
        }),
        retention_expires_at=_expires(settings.PEER_SUPPORTER_RETENTION_DAYS),
    )
    db.add(supporter)
    actor = PeerPrincipal(str(supporter_id), "supporter")
    _audit(db, actor, "supporter.application.draft_created", "supporter", str(supporter_id))
    _status_history(db, actor, "supporter", str(supporter_id), None, "draft")
    await db.commit()
    return {"supporter_id": str(supporter_id), "status": "draft", "access_token": create_peer_token("supporter", str(supporter_id)), "token_type": "bearer"}


@router.post("/peer-signups/{supporter_id}/submit")
async def submit_supporter_application(supporter_id: uuid.UUID, payload: SupporterPolicyAcceptanceRequest, actor: PeerPrincipal = Depends(require_supporter), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    if actor.subject_id != str(supporter_id):
        raise HTTPException(status_code=403, detail="Supporters may submit only their own application.")
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter application not found.")
    if supporter.status != "draft":
        raise HTTPException(status_code=409, detail="Only a draft application can be submitted.")
    now = datetime.now(timezone.utc)
    supporter.policy_version = payload.policy_version
    supporter.policy_accepted_at = now
    supporter.status = "submitted"
    _status_history(db, actor, "supporter", str(supporter_id), "draft", "submitted")
    _audit(db, actor, "supporter.application.submitted", "supporter", str(supporter_id), {"from": "draft", "to": "submitted"})
    await db.commit()
    _send_email(settings.ADMIN_EMAIL, "application", str(supporter_id))
    return {"supporter_id": str(supporter_id), "status": "submitted"}


@router.post("/peer-signups/{supporter_id}/transition")
async def transition_supporter_application(supporter_id: uuid.UUID, payload: SupporterTransitionRequest, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter application not found.")
    await _transition_supporter(db, supporter, actor, payload.target_status, payload.reason_code)
    await db.commit()
    return {"supporter_id": str(supporter_id), "status": supporter.status}


@router.post("/peer-signups/{supporter_id}/identity-verification")
async def record_supporter_identity_verification(supporter_id: uuid.UUID, payload: IdentityVerificationEvidenceRequest, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    if settings.is_production:
        raise HTTPException(status_code=503, detail="Cornell OIDC identity verification integration is required before production verification.")
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter application not found.")
    if supporter.status != "identity_pending":
        raise HTTPException(status_code=409, detail="Identity evidence may be recorded only while identity verification is pending.")
    supporter.identity_verified_at = datetime.now(timezone.utc)
    supporter.identity_verification_method = "manual_nonproduction_review"
    supporter.identity_subject_hash = _protected_hash("cornell-identity", payload.verification_reference)
    supporter.identity_verified_by = actor.subject_id
    _audit(db, actor, "supporter.identity.manual_nonproduction_recorded", "supporter", str(supporter_id))
    await db.commit()
    return {"supporter_id": str(supporter_id), "identity_status": "manual_nonproduction_recorded", "production_eligible": False}


@router.post("/peer-signups/{supporter_id}/reference-invitations", status_code=201)
async def create_reference_invitation(supporter_id: uuid.UUID, payload: ReferenceInvitationRequest, request: Request, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    if actor.role != "administrator" and (actor.role != "supporter" or actor.subject_id != str(supporter_id)):
        raise HTTPException(status_code=403, detail="Only the applicant or an administrator may invite a reference.")
    await enforce_persistent_rate_limit(db, "reference-invitation", actor.subject_id, 3, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter application not found.")
    if supporter.status != "reference_pending":
        raise HTTPException(status_code=409, detail="References may be invited only after identity verification.")
    existing_result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.supporter_id == supporter_id,
        SupporterReferenceInvitation.status.in_(["pending", "accepted"]),
        SupporterReferenceInvitation.deleted_at.is_(None),
    ))
    if existing_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An active or completed reference invitation already exists.")
    invitation_id = uuid.uuid4()
    token = token_urlsafe(32)
    invitation = SupporterReferenceInvitation(
        invitation_id=invitation_id,
        supporter_id=supporter_id,
        token_hash=_protected_hash("reference-invitation", token),
        invitee_email_encrypted=encrypt_private_data({"email": payload.email}),
        status="pending",
        expires_at=_expires(settings.PEER_REFERENCE_INVITATION_DAYS),
    )
    db.add(invitation)
    _audit(db, actor, "supporter.reference.invited", "reference_invitation", str(invitation_id), {"supporter_id": str(supporter_id), "invitation_id": str(invitation_id)})
    await db.commit()
    _send_reference_invitation(payload.email, token)
    return {"invitation_id": str(invitation_id), "status": "pending", "expires_at": invitation.expires_at.isoformat()}


@router.get("/peer-signups/{supporter_id}/reference-invitations")
async def get_reference_invitations(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_workflow), db: AsyncSession = Depends(get_db)):
    if actor.role != "administrator" and (actor.role != "supporter" or actor.subject_id != str(supporter_id)):
        raise HTTPException(status_code=403, detail="Only the applicant or an administrator may view reference invitation status.")
    result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.supporter_id == supporter_id,
        SupporterReferenceInvitation.deleted_at.is_(None),
    ).order_by(SupporterReferenceInvitation.created_at.desc()))
    response = []
    for invitation in result.scalars().all():
        item = {
            "invitation_id": str(invitation.invitation_id),
            "status": invitation.status,
            "created_at": invitation.created_at.isoformat() if invitation.created_at else None,
            "expires_at": invitation.expires_at.isoformat() if invitation.expires_at else None,
            "responded_at": invitation.responded_at.isoformat() if invitation.responded_at else None,
        }
        if actor.role == "administrator":
            item["private"] = {
                "invitee": decrypt_private_data(invitation.invitee_email_encrypted),
                "response": decrypt_private_data(invitation.response_encrypted),
            }
        response.append(item)
    _audit(db, actor, "supporter.reference.status_read", "supporter", str(supporter_id))
    await db.commit()
    return response


@router.post("/peer/reference-invitations/respond", dependencies=[Depends(require_supporter_signup)])
async def respond_to_reference_invitation(payload: ReferenceDecisionRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "reference-response", _client_ip(request), 5, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    token_hash = _protected_hash("reference-invitation", payload.token)
    result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.token_hash == token_hash,
        SupporterReferenceInvitation.status == "pending",
        SupporterReferenceInvitation.deleted_at.is_(None),
    ))
    invitation = result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=404, detail="Reference invitation not found or already used.")
    expires_at = invitation.expires_at if invitation.expires_at.tzinfo else invitation.expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        invitation.status = "expired"
        invitation.invitee_email_encrypted = encrypt_private_data({"expired": True})
        await db.commit()
        raise HTTPException(status_code=410, detail="Reference invitation has expired.")
    now = datetime.now(timezone.utc)
    invitation.responded_at = now
    if payload.consent:
        invitation.status = "accepted"
        invitation.consented_at = now
        invitation.response_encrypted = encrypt_private_data({"relationship": payload.relationship, "statement": payload.statement})
    else:
        invitation.status = "declined"
        invitation.invitee_email_encrypted = encrypt_private_data({"declined": True})
        invitation.response_encrypted = None
    _audit_reference(db, f"supporter.reference.{invitation.status}", invitation)
    await db.commit()
    return {"invitation_id": str(invitation.invitation_id), "status": invitation.status}


@router.post("/peer-signups/{supporter_id}/training-completion")
async def record_training_completion(supporter_id: uuid.UUID, payload: TrainingCompletionRequest, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter application not found.")
    if supporter.status != "training_pending":
        raise HTTPException(status_code=409, detail="Training evidence may be recorded only while training is pending.")
    supporter.training_requirements_version = payload.requirements_version
    supporter.training_modules_completed = payload.completed_modules
    supporter.training_completed_at = datetime.now(timezone.utc)
    supporter.training_evidence_hash = _protected_hash("supporter-training-evidence", payload.evidence_reference)
    supporter.training_verified_by = actor.subject_id
    _audit(db, actor, "supporter.training.requirements_recorded", "supporter", str(supporter_id))
    await db.commit()
    return {"supporter_id": str(supporter_id), "training_requirements_status": "complete", "requirements_version": payload.requirements_version}


@router.post("/peer/requesters", dependencies=[Depends(require_peer_connect)], status_code=201)
async def register_requester(payload: RequesterRegistrationRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "requester-registration", _client_ip(request), 5, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    requester_id = uuid.uuid4()
    requester = PeerRequester(
        requester_id=requester_id,
        credential_hash=hash_peer_password(payload.password),
        private_data_encrypted=encrypt_private_data({"display_name": payload.display_name, "email": payload.email, "phone": payload.phone}),
        retention_expires_at=_expires(settings.PEER_REQUEST_RETENTION_DAYS),
    )
    db.add(requester)
    actor = PeerPrincipal(str(requester_id), "requester")
    _audit(db, actor, "requester.registered", "requester", str(requester_id))
    _status_history(db, actor, "requester", str(requester_id), None, "active")
    await db.commit()
    return {
        "requester_id": str(requester_id),
        "access_token": create_peer_token("requester", str(requester_id)),
        "token_type": "bearer",
        "identity_status": "pending",
    }


@router.post("/peer/requesters/{requester_id}/identity-verification")
async def record_requester_identity_verification(requester_id: uuid.UUID, payload: IdentityVerificationEvidenceRequest, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    if settings.is_production:
        raise HTTPException(status_code=503, detail="Cornell OIDC integration is required before production requester verification can be enabled.")
    requester = await _active_requester(db, requester_id)
    requester.identity_verified_at = datetime.now(timezone.utc)
    requester.identity_verification_method = "manual_nonproduction_review"
    requester.identity_subject_hash = _protected_hash("cornell-requester-identity", payload.verification_reference)
    requester.identity_verified_by = actor.subject_id
    _audit(db, actor, "requester.identity.nonproduction_recorded", "requester", str(requester_id))
    await db.commit()
    return {
        "requester_id": str(requester_id),
        "identity_status": "verified_nonproduction",
        "production_eligible": False,
    }


@router.post("/peer/auth/login")
async def peer_login(payload: PeerLoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "peer-login", _client_ip(request), settings.ADMIN_LOGIN_MAX_ATTEMPTS, settings.ADMIN_LOGIN_WINDOW_SECONDS)
    password_hash: str | None = None
    active = False
    if payload.role == "moderator" and payload.subject_id == "moderator":
        password_hash = settings.MODERATOR_PASSWORD_HASH
        active = True
    else:
        try:
            subject_uuid = uuid.UUID(payload.subject_id)
        except ValueError:
            subject_uuid = None
        if subject_uuid and payload.role == "supporter":
            result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == subject_uuid, PeerSignup.deleted_at.is_(None), PeerSignup.retention_expires_at > datetime.now(timezone.utc)))
            record = result.scalar_one_or_none()
            password_hash = record.credential_hash if record else None
            active = bool(record and record.status not in {"withdrawn", "rejected", "deleted", "expired"})
        if subject_uuid and payload.role == "requester":
            result = await db.execute(select(PeerRequester).where(PeerRequester.requester_id == subject_uuid, PeerRequester.deleted_at.is_(None), PeerRequester.retention_expires_at > datetime.now(timezone.utc)))
            record = result.scalar_one_or_none()
            password_hash = record.credential_hash if record else None
            active = bool(record and record.status == "active")
    if not active or not verify_peer_password(payload.password, password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")
    return {"access_token": create_peer_token(payload.role, payload.subject_id), "token_type": "bearer", "expires_in": settings.PEER_TOKEN_MINUTES * 60}


@router.get("/peer-supporters", dependencies=[Depends(require_peer_connect)])
async def get_supporters(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    consented_reference_exists = select(SupporterReferenceInvitation.invitation_id).where(
        SupporterReferenceInvitation.supporter_id == PeerSignup.supporter_id,
        SupporterReferenceInvitation.status == "accepted",
        SupporterReferenceInvitation.consented_at.is_not(None),
        SupporterReferenceInvitation.deleted_at.is_(None),
    ).exists()
    result = await db.execute(select(PeerSignup).where(
        PeerSignup.status == "approved",
        PeerSignup.policy_version == SUPPORTER_POLICY_VERSION,
        PeerSignup.policy_accepted_at.is_not(None),
        PeerSignup.identity_verified_at.is_not(None),
        PeerSignup.identity_verification_method == "cornell_oidc",
        PeerSignup.identity_subject_hash.is_not(None),
        PeerSignup.training_requirements_version == SUPPORTER_TRAINING_VERSION,
        PeerSignup.training_completed_at.is_not(None),
        PeerSignup.training_evidence_hash.is_not(None),
        consented_reference_exists,
        PeerSignup.deleted_at.is_(None),
        PeerSignup.withdrawn_at.is_(None),
        PeerSignup.retention_expires_at > now,
    ).order_by(PeerSignup.submitted_at.desc()))
    return [public_supporter_dict(supporter) for supporter in result.scalars().all()]


@router.get("/peer/supporters/{supporter_id}/private")
async def get_supporter_private(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_workflow), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(supporter_id))
    if actor.role == "supporter":
        supporter = await _active_supporter(db, supporter_id, approved=False)
    else:
        result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
        supporter = result.scalar_one_or_none()
        if not supporter:
            raise HTTPException(status_code=404, detail="Supporter not found.")
    private = _supporter_private(supporter) if actor.role in {"supporter", "administrator"} else {}
    _audit(db, actor, "supporter.private.read" if actor.role in {"supporter", "administrator"} else "supporter.profile.read", "supporter", str(supporter_id))
    await db.commit()
    response = {**public_supporter_dict(supporter), "status": supporter.status}
    if actor.role in {"supporter", "administrator"}:
        response["private_contact"] = {"email": private.get("email"), "phone": private.get("phone")}
    if actor.role == "administrator":
        response["reference"] = {key: private.get(key) for key in ("reference_name", "reference_phone", "reference_email", "reference_relationship")}
    return response


@router.get("/peer-signups")
async def get_signups(actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.deleted_at.is_(None)).order_by(PeerSignup.submitted_at.desc()))
    response = []
    for supporter in result.scalars().all():
        item = {**public_supporter_dict(supporter), "status": supporter.status, "submitted_at": supporter.submitted_at.isoformat() if supporter.submitted_at else None}
        if actor.role == "administrator":
            item["private"] = _supporter_private(supporter)
        response.append(item)
    _audit(db, actor, "supporter.applications.read", "supporter_collection", "all")
    await db.commit()
    return response


@router.post("/peer-signups/{supporter_id}/approve")
async def approve_signup(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_supporter_signup), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter not found.")
    await _transition_supporter(db, supporter, actor, "approved", "requirements_complete")
    await db.commit()
    private = _supporter_private(supporter)
    _send_email(str(private.get("email") or ""), "approval", str(supporter_id))
    return {"supporter_id": str(supporter_id), "status": "approved"}


@router.post("/peer-connect", dependencies=[Depends(require_peer_connect)], status_code=201)
async def peer_connect(payload: ConnectRequest, request: Request, actor: PeerPrincipal = Depends(require_requester), db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "peer-connect", actor.subject_id, 5, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    requester_id = uuid.UUID(actor.subject_id)
    await _verified_requester(db, requester_id)
    supporter = await _verified_supporter(db, payload.supporter_id)
    block_result = await db.execute(select(PeerBlock).where(
        PeerBlock.supporter_id == payload.supporter_id,
        PeerBlock.requester_id == requester_id,
        PeerBlock.active.is_(True),
        PeerBlock.deleted_at.is_(None),
        PeerBlock.retention_expires_at > datetime.now(timezone.utc),
    ))
    if block_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="This connection is unavailable.")
    existing_result = await db.execute(select(PeerConnectRequest).where(
        PeerConnectRequest.supporter_id == payload.supporter_id,
        PeerConnectRequest.requester_id == requester_id,
        PeerConnectRequest.status.in_(["pending", "accepted"]),
        PeerConnectRequest.deleted_at.is_(None),
    ))
    existing = existing_result.scalar_one_or_none()
    if existing:
        await _expire_connection_if_needed(db, existing)
        if existing.status in {"pending", "accepted"}:
            raise HTTPException(status_code=409, detail="An active request already exists for this supporter.")
    request_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    connection = PeerConnectRequest(
        request_id=request_id,
        supporter_id=payload.supporter_id,
        requester_id=requester_id,
        private_data_encrypted=encrypt_private_data({
            "location_id": payload.location_id,
            "meeting_window_id": payload.meeting_window_id,
            "message": payload.message,
        }),
        status="pending",
        requester_consented_at=now,
        expires_at=now + timedelta(hours=settings.PEER_REQUEST_RESPONSE_HOURS),
        retention_expires_at=_expires(settings.PEER_REQUEST_RETENTION_DAYS),
    )
    db.add(connection)
    _status_history(db, actor, "connection_request", str(request_id), None, "pending")
    _audit(db, actor, "connection.created", "connection_request", str(request_id), {"supporter_id": str(payload.supporter_id)})
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An active request already exists for this supporter.") from exc
    supporter_private = _supporter_private(supporter)
    attempt = _send_email(str(supporter_private.get("email") or ""), "connection", str(request_id))
    notification = _record_notification(db, "connection_request_submitted", "connection_request", str(request_id), "supporter", str(payload.supporter_id), attempt)
    await db.commit()
    response = _connection_summary(connection, include_details=False)
    response["notification"] = _notification_summary(notification)
    return response


@router.get("/peer/public-meeting-options", dependencies=[Depends(require_peer_connect)])
async def get_public_meeting_options():
    return {
        "locations": PUBLIC_MEETING_LOCATIONS,
        "meeting_windows": SAFE_MEETING_WINDOWS,
        "safety_note": PUBLIC_MEETING_SAFETY_NOTE,
    }


@router.get("/peer-requests")
async def get_requests(actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.deleted_at.is_(None)).order_by(PeerConnectRequest.requested_at.desc()))
    response = []
    for connection in result.scalars().all():
        await _expire_connection_if_needed(db, connection)
        response.append(_connection_summary(connection, include_details=actor.role == "administrator"))
    _audit(db, actor, "connections.read", "connection_collection", "all")
    await db.commit()
    return response


@router.get("/peer/supporters/{supporter_id}/requests")
async def get_supporter_requests(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(supporter_id))
    if actor.role == "supporter":
        await _verified_supporter(db, supporter_id)
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.supporter_id == supporter_id, PeerConnectRequest.deleted_at.is_(None)).order_by(PeerConnectRequest.requested_at.desc()))
    response = []
    for connection in result.scalars().all():
        await _expire_connection_if_needed(db, connection)
        response.append(_connection_summary(connection, include_details=actor.role in {"supporter", "administrator"}))
    _audit(db, actor, "supporter.connections.read", "supporter", str(supporter_id))
    await db.commit()
    return response


@router.get("/peer/requesters/{requester_id}/requests")
async def get_requester_requests(requester_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(requester_id))
    if actor.role == "requester":
        await _verified_requester(db, requester_id)
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.requester_id == requester_id, PeerConnectRequest.deleted_at.is_(None)).order_by(PeerConnectRequest.requested_at.desc()))
    response = []
    for connection in result.scalars().all():
        await _expire_connection_if_needed(db, connection)
        response.append(_connection_summary(connection, include_details=actor.role in {"requester", "administrator"}))
    _audit(db, actor, "requester.connections.read", "requester", str(requester_id))
    await db.commit()
    return response


@router.post("/peer-requests/{request_id}/resolve")
async def resolve_request(request_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    return await _change_request_status(request_id, "unavailable", actor, db)


@router.post("/peer-requests/{request_id}/supporter-action")
async def supporter_connection_action(request_id: uuid.UUID, payload: SupporterConnectionActionRequest, actor: PeerPrincipal = Depends(require_supporter), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    if str(connection.supporter_id) != actor.subject_id:
        raise HTTPException(status_code=403, detail="Supporters may respond only to their own requests.")
    await _verified_supporter(db, uuid.UUID(actor.subject_id))
    target = {"accept": "accepted", "decline": "declined", "expire": "expired", "block": "blocked"}[payload.action]
    if target == "accepted":
        await _verified_requester(db, connection.requester_id)
    if target == "blocked":
        await _create_participant_block(db, connection, actor, "participant_safety_choice")
    else:
        await _transition_connection(db, connection, actor, target)
    await db.commit()
    return _connection_summary(connection, include_details=False)


@router.post("/peer-requests/{request_id}/block", status_code=201)
async def block_connection_participant(request_id: uuid.UUID, payload: ParticipantBlockRequest, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    if actor.role == "requester":
        await _verified_requester(db, uuid.UUID(actor.subject_id))
    elif actor.role == "supporter":
        await _verified_supporter(db, uuid.UUID(actor.subject_id))
    block = await _create_participant_block(db, connection, actor, payload.reason_code)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="A block is already active for this participant pair.") from exc
    return {"block_id": str(block.block_id), "request_id": str(request_id), "status": "active"}


@router.post("/peer-requests/{request_id}/cancel")
async def cancel_connection_request(request_id: uuid.UUID, actor: PeerPrincipal = Depends(require_requester), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    if str(connection.requester_id) != actor.subject_id:
        raise HTTPException(status_code=403, detail="Requesters may cancel only their own requests.")
    await _verified_requester(db, uuid.UUID(actor.subject_id))
    await _transition_connection(db, connection, actor, "canceled")
    await db.commit()
    return _connection_summary(connection, include_details=False)


@router.post("/peer-requests/{request_id}/status")
async def update_request_status(request_id: uuid.UUID, payload: StatusRequest, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    if actor.role == "requester" and (str(connection.requester_id) != actor.subject_id or payload.status != "canceled"):
        raise HTTPException(status_code=403, detail="Requester may cancel only their own request.")
    if actor.role == "supporter" and (str(connection.supporter_id) != actor.subject_id or payload.status not in {"accepted", "declined", "expired", "blocked"}):
        raise HTTPException(status_code=403, detail="Supporter may respond only to their own request.")
    if actor.role in {"moderator", "administrator"} and payload.status not in {"expired", "unavailable"}:
        raise HTTPException(status_code=403, detail="Staff may mark requests only expired or unavailable.")
    if actor.role == "requester":
        await _verified_requester(db, uuid.UUID(actor.subject_id))
    if actor.role == "supporter":
        await _verified_supporter(db, uuid.UUID(actor.subject_id))
    if actor.role not in {"requester", "supporter", "moderator", "administrator"}:
        raise HTTPException(status_code=403, detail="Not authorized to update this request.")
    return await _change_request_status(request_id, payload.status, actor, db, connection)


async def _change_request_status(request_id: uuid.UUID, new_status: str, actor: PeerPrincipal, db: AsyncSession, connection: PeerConnectRequest | None = None):
    if connection is None:
        result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
        connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    await _transition_connection(db, connection, actor, new_status)
    await db.commit()
    return _connection_summary(connection, include_details=False)


@router.post("/peer-requests/{request_id}/messages", status_code=201)
async def send_relay_message(request_id: uuid.UUID, payload: RelayMessageRequest, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    _assert_connection_participant(connection, actor)
    if actor.role not in {"requester", "supporter"}:
        raise HTTPException(status_code=403, detail="Only connection participants may send relay messages.")
    if actor.role == "requester":
        await _verified_requester(db, uuid.UUID(actor.subject_id))
    else:
        await _verified_supporter(db, uuid.UUID(actor.subject_id))
    if connection.status != "accepted" or not connection.requester_consented_at or not connection.supporter_consented_at:
        raise HTTPException(status_code=409, detail="The in-app relay opens only after both people consent.")
    message_id = uuid.uuid4()
    message = PeerRelayMessage(
        message_id=message_id,
        request_id=request_id,
        sender_role=actor.role,
        sender_id=uuid.UUID(actor.subject_id),
        body_encrypted=encrypt_private_data({"body": payload.body}),
        retention_expires_at=_expires(settings.PEER_RELAY_RETENTION_DAYS),
    )
    db.add(message)
    connection.last_relay_at = datetime.now(timezone.utc)
    _audit(db, actor, "connection.relay.sent", "connection_request", str(request_id))
    await db.commit()
    return {"message_id": str(message_id), "request_id": str(request_id), "status": "sent"}


@router.get("/peer-requests/{request_id}/messages")
async def get_relay_messages(request_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    _assert_connection_participant(connection, actor)
    if actor.role not in {"requester", "supporter"}:
        raise HTTPException(status_code=403, detail="Staff cannot read private relay messages.")
    message_result = await db.execute(select(PeerRelayMessage).where(
        PeerRelayMessage.request_id == request_id,
        PeerRelayMessage.deleted_at.is_(None),
        PeerRelayMessage.retention_expires_at > datetime.now(timezone.utc),
    ).order_by(PeerRelayMessage.created_at.asc()).limit(200))
    response = []
    for message in message_result.scalars().all():
        private = decrypt_private_data(message.body_encrypted)
        response.append({"message_id": str(message.message_id), "sender_role": message.sender_role, "body": private.get("body"), "created_at": message.created_at.isoformat() if message.created_at else None})
    _audit(db, actor, "connection.relay.read", "connection_request", str(request_id), {"messages": len(response)})
    await db.commit()
    return response


@router.post("/peer-requests/{request_id}/report", status_code=201)
async def report_connection(request_id: uuid.UUID, payload: ConnectionSafetyReportRequest, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "connection-report", actor.subject_id, 3, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    _assert_connection_participant(connection, actor)
    if actor.role not in {"requester", "supporter"}:
        raise HTTPException(status_code=403, detail="Only connection participants may submit a safety report.")
    if actor.role == "requester":
        target_role, target_id = "supporter", connection.supporter_id
    else:
        target_role, target_id = "requester", connection.requester_id
    duplicate_result = await db.execute(select(PeerConnectionReport).where(
        PeerConnectionReport.request_id == request_id,
        PeerConnectionReport.reporter_role == actor.role,
        PeerConnectionReport.reporter_id == uuid.UUID(actor.subject_id),
        PeerConnectionReport.status.in_(["submitted", "triaged", "investigating"]),
        PeerConnectionReport.deleted_at.is_(None),
    ))
    if duplicate_result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="An active safety report already exists for this connection.")
    report_id = uuid.uuid4()
    report = PeerConnectionReport(
        connection_report_id=report_id,
        request_id=request_id,
        reporter_role=actor.role,
        reporter_id=uuid.UUID(actor.subject_id),
        target_role=target_role,
        target_id=target_id,
        reason_encrypted=encrypt_private_data({"reason": payload.reason}),
        status="submitted",
        retention_expires_at=_expires(settings.PEER_REPORT_RETENTION_DAYS),
    )
    db.add(report)
    _status_history(db, actor, "connection_report", str(report_id), None, "submitted")
    _audit(db, actor, "connection.report.created", "connection_report", str(report_id), {"requester_id": str(connection.requester_id), "supporter_id": str(connection.supporter_id)})
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=409, detail="An active safety report already exists for this connection.") from exc
    attempt = _send_email(settings.PEER_SAFETY_CONTACT_EMAIL, "report", str(report_id))
    notification = _record_notification(db, "safety_report_submitted", "connection_report", str(report_id), "operator", "safety_contact", attempt)
    await db.commit()
    return {"connection_report_id": str(report_id), "request_id": str(request_id), "status": "submitted", "notification": _notification_summary(notification)}


@router.get("/peer/connection-reports")
async def get_connection_reports(actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.deleted_at.is_(None)).order_by(PeerConnectionReport.reported_at.desc()).limit(100))
    response = []
    for report in result.scalars().all():
        response.append({
            "connection_report_id": str(report.connection_report_id),
            "request_id": str(report.request_id),
            "reporter_role": report.reporter_role,
            "target_role": report.target_role,
            "status": report.status,
            "severity": report.severity,
            "assigned_to_role": report.assigned_to_role,
            "assigned_to_id": report.assigned_to_id,
            "reported_at": report.reported_at.isoformat() if report.reported_at else None,
        })
    _audit(db, actor, "connection.reports.read", "connection_report_collection", "all", {"connection_reports": len(response)})
    await db.commit()
    return response


@router.get("/peer/connection-reports/{report_id}")
async def get_connection_report_detail(report_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.connection_report_id == report_id, PeerConnectionReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Connection report not found.")
    private = decrypt_private_data(report.reason_encrypted)
    note_result = await db.execute(select(PeerModerationNote).where(PeerModerationNote.connection_report_id == report_id, PeerModerationNote.deleted_at.is_(None)).order_by(PeerModerationNote.created_at.asc()))
    notes = []
    for note in note_result.scalars().all():
        note_private = decrypt_private_data(note.note_encrypted)
        notes.append({"note_id": str(note.note_id), "author_role": note.author_role, "note": note_private.get("note"), "created_at": note.created_at.isoformat() if note.created_at else None})
    _audit(db, actor, "connection.report.detail_read", "connection_report", str(report_id))
    await db.commit()
    return {
        "connection_report_id": str(report_id), "request_id": str(report.request_id),
        "reporter_role": report.reporter_role, "target_role": report.target_role,
        "status": report.status, "severity": report.severity,
        "assigned_to_role": report.assigned_to_role, "assigned_to_id": report.assigned_to_id,
        "reason": private.get("reason"), "notes": notes,
        "resolution_code": report.resolution_code,
        "resolution_summary": (decrypt_private_data(report.resolution_encrypted).get("summary") if report.resolution_encrypted else None),
    }


@router.post("/peer/connection-reports/{report_id}/triage")
async def triage_connection_report(report_id: uuid.UUID, payload: ReportTriageRequest, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    if payload.severity not in REPORT_SEVERITIES:
        raise HTTPException(status_code=422, detail="Unsupported report severity.")
    if actor.role == "moderator" and (payload.assigned_to_role != "moderator" or payload.assigned_to_id != actor.subject_id):
        raise HTTPException(status_code=403, detail="Moderators may assign a report only to themselves.")
    result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.connection_report_id == report_id, PeerConnectionReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Connection report not found.")
    if not report_transition_allowed(report.status, "triaged"):
        raise HTTPException(status_code=409, detail=f"Report cannot move from {report.status} to triaged.")
    previous = report.status
    report.status = "triaged"
    report.severity = payload.severity
    report.assigned_to_role = payload.assigned_to_role
    report.assigned_to_id = payload.assigned_to_id
    report.triaged_at = datetime.now(timezone.utc)
    report.triaged_by = actor.subject_id
    _status_history(db, actor, "connection_report", str(report_id), previous, "triaged")
    _audit(db, actor, "connection.report.triaged", "connection_report", str(report_id), {"from": previous, "to": "triaged"})
    await db.commit()
    return {"connection_report_id": str(report_id), "status": "triaged", "severity": report.severity, "assigned_to_role": report.assigned_to_role, "assigned_to_id": report.assigned_to_id, **({"emergency_boundaries": EMERGENCY_BOUNDARIES} if report.severity == "critical" else {})}


@router.post("/peer/connection-reports/{report_id}/notes", status_code=201)
async def add_connection_report_note(report_id: uuid.UUID, payload: ModerationNoteRequest, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.connection_report_id == report_id, PeerConnectionReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Connection report not found.")
    if report.status not in {"triaged", "investigating"}:
        raise HTTPException(status_code=409, detail="Notes may be added only to a triaged or investigating report.")
    if actor.role == "moderator" and (report.assigned_to_role != "moderator" or report.assigned_to_id != actor.subject_id):
        raise HTTPException(status_code=403, detail="This report is not assigned to the moderator.")
    note = PeerModerationNote(
        note_id=uuid.uuid4(), connection_report_id=report_id,
        author_role=actor.role, author_id=actor.subject_id,
        note_encrypted=encrypt_private_data({"note": payload.note}),
        retention_expires_at=_expires(settings.PEER_MODERATION_NOTE_RETENTION_DAYS),
    )
    db.add(note)
    if report.status == "triaged":
        report.status = "investigating"
        _status_history(db, actor, "connection_report", str(report_id), "triaged", "investigating")
    _audit(db, actor, "connection.report.note_added", "connection_report", str(report_id))
    await db.commit()
    return {"note_id": str(note.note_id), "connection_report_id": str(report_id), "status": report.status}


@router.post("/peer/connection-reports/{report_id}/resolve")
async def resolve_connection_report(report_id: uuid.UUID, payload: ReportResolutionRequest, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    if payload.resolution_code not in RESOLUTION_CODES:
        raise HTTPException(status_code=422, detail="Unsupported resolution code.")
    result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.connection_report_id == report_id, PeerConnectionReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Connection report not found.")
    if actor.role == "moderator" and (report.assigned_to_role != "moderator" or report.assigned_to_id != actor.subject_id):
        raise HTTPException(status_code=403, detail="This report is not assigned to the moderator.")
    if not report_transition_allowed(report.status, payload.outcome):
        raise HTTPException(status_code=409, detail=f"Report cannot move from {report.status} to {payload.outcome}.")
    previous = report.status
    report.status = payload.outcome
    report.resolution_code = payload.resolution_code
    report.resolution_encrypted = encrypt_private_data({"summary": payload.summary})
    report.resolved_by = actor.subject_id
    report.resolved_at = datetime.now(timezone.utc)
    report.duplicate_of = payload.duplicate_of
    _status_history(db, actor, "connection_report", str(report_id), previous, payload.outcome)
    _audit(db, actor, "connection.report.resolved", "connection_report", str(report_id), {"from": previous, "to": payload.outcome, "reason_code": payload.resolution_code})
    await db.commit()
    return {"connection_report_id": str(report_id), "status": report.status, "resolution_code": report.resolution_code}


@router.get("/peer/connection-reports/{report_id}/history")
async def get_connection_report_history(report_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    report_result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.connection_report_id == report_id, PeerConnectionReport.deleted_at.is_(None)))
    if not report_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Connection report not found.")
    status_result = await db.execute(select(PeerStatusHistory).where(PeerStatusHistory.entity_type == "connection_report", PeerStatusHistory.entity_id == str(report_id)).order_by(PeerStatusHistory.changed_at.asc()))
    audit_result = await db.execute(select(PeerAuditLog).where(PeerAuditLog.target_type == "connection_report", PeerAuditLog.target_id == str(report_id)).order_by(PeerAuditLog.occurred_at.asc()))
    _audit(db, actor, "connection.report.history_read", "connection_report", str(report_id))
    await db.commit()
    return {
        "status_history": [{"from": item.previous_status, "to": item.new_status, "actor_role": item.actor_role, "changed_at": item.changed_at.isoformat() if item.changed_at else None} for item in status_result.scalars().all()],
        "audit_history": [{"action": item.action, "actor_role": item.actor_role, "occurred_at": item.occurred_at.isoformat() if item.occurred_at else None} for item in audit_result.scalars().all()],
    }


@router.post("/peer/safety/subjects/{subject_role}/{subject_id}/status")
async def update_peer_subject_safety_status(subject_role: Literal["supporter", "requester"], subject_id: uuid.UUID, payload: SubjectSafetyActionRequest, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    if payload.action == "reinstate" and actor.role != "administrator":
        raise HTTPException(status_code=403, detail="Only an administrator may reinstate a suspended participant.")
    now = datetime.now(timezone.utc)
    if subject_role == "supporter":
        result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == subject_id, PeerSignup.deleted_at.is_(None)))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Supporter not found.")
        if payload.action == "suspend":
            if subject.status != "approved":
                raise HTTPException(status_code=409, detail="Only an approved supporter may be suspended.")
            await _transition_supporter(db, subject, actor, "suspended", "safety_review")
        else:
            if subject.status != "suspended":
                raise HTTPException(status_code=409, detail="Only a suspended supporter may be reinstated.")
            readiness_errors = await _supporter_readiness_errors(db, subject)
            if readiness_errors:
                raise HTTPException(status_code=409, detail="Reinstatement requirements incomplete: " + ", ".join(readiness_errors) + ".")
            subject.status = "approved"
            subject.approved = True
            subject.suspended_at = None
            _status_history(db, actor, "supporter", str(subject_id), "suspended", "approved")
            _audit(db, actor, "supporter.reinstated", "supporter", str(subject_id), {"reason_code": payload.reason_code})
    else:
        result = await db.execute(select(PeerRequester).where(PeerRequester.requester_id == subject_id, PeerRequester.deleted_at.is_(None)))
        subject = result.scalar_one_or_none()
        if not subject:
            raise HTTPException(status_code=404, detail="Requester not found.")
        expected = "active" if payload.action == "suspend" else "suspended"
        if subject.status != expected:
            raise HTTPException(status_code=409, detail=f"Requester must be {expected} for this action.")
        previous = subject.status
        subject.status = "suspended" if payload.action == "suspend" else "active"
        subject.suspended_at = now if payload.action == "suspend" else None
        _status_history(db, actor, "requester", str(subject_id), previous, subject.status)
        _audit(db, actor, f"requester.{payload.action}ed", "requester", str(subject_id), {"reason_code": payload.reason_code})
        if payload.action == "suspend":
            connection_result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.requester_id == subject_id, PeerConnectRequest.status.in_(["pending", "accepted"]), PeerConnectRequest.deleted_at.is_(None)))
            for connection in connection_result.scalars().all():
                await _transition_connection(db, connection, actor, "unavailable")
    await db.commit()
    attempt = _send_email(settings.PEER_SAFETY_CONTACT_EMAIL, "report", str(subject_id))
    notification = _record_notification(db, f"participant_{payload.action}ed", subject_role, str(subject_id), "operator", "safety_contact", attempt)
    await db.commit()
    return {"subject_role": subject_role, "subject_id": str(subject_id), "status": subject.status, "notification": _notification_summary(notification)}


@router.get("/peer/notifications/{notification_id}")
async def get_peer_notification_status(notification_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerNotification).where(PeerNotification.notification_id == notification_id, PeerNotification.deleted_at.is_(None)))
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found.")
    _audit(db, actor, "notification.status_read", "notification", str(notification_id))
    await db.commit()
    return _notification_summary(notification)


@router.post("/report-supporter", dependencies=[Depends(require_peer_connect)], status_code=201)
async def report_supporter(payload: ReportRequest, request: Request, actor: PeerPrincipal = Depends(require_requester), db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "supporter-report", actor.subject_id, 3, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    await _active_requester(db, uuid.UUID(actor.subject_id))
    raise HTTPException(status_code=410, detail="Standalone supporter reports are retired. Submit a safety report from the authenticated connection so participant identity and authorization can be verified.")


@router.get("/reports")
async def get_reports(actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SupporterReport).where(SupporterReport.deleted_at.is_(None)).order_by(SupporterReport.reported_at.desc()))
    response = []
    for report in result.scalars().all():
        response.append({"report_id": str(report.report_id), "supporter_id": str(report.supporter_id), "status": report.status, "reported_at": report.reported_at.isoformat() if report.reported_at else None, "legacy": True})
    _audit(db, actor, "reports.read", "report_collection", "all")
    await db.commit()
    return response


@router.post("/reports/{report_id}/resolve")
async def resolve_report(report_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SupporterReport).where(SupporterReport.report_id == report_id, SupporterReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    previous = report.status
    report.status = "resolved"
    report.resolved = True
    _status_history(db, actor, "supporter_report", str(report_id), previous, "resolved")
    _audit(db, actor, "report.resolved", "supporter_report", str(report_id))
    await db.commit()
    return {"report_id": str(report_id), "status": "resolved"}


@router.post("/peer/supporters/{supporter_id}/withdraw")
async def withdraw_supporter(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), db: AsyncSession = Depends(get_db)):
    if actor.role != "administrator" and (actor.role != "supporter" or actor.subject_id != str(supporter_id)):
        raise HTTPException(status_code=403, detail="Only the supporter or an administrator may withdraw an application.")
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter not found.")
    previous = supporter.status
    if not transition_allowed(previous, "withdrawn"):
        raise HTTPException(status_code=409, detail=f"Supporter application cannot move from {previous} to withdrawn.")
    supporter.status = "withdrawn"
    supporter.approved = False
    supporter.withdrawn_at = datetime.now(timezone.utc)
    supporter.private_data_encrypted = None
    supporter.credential_hash = None
    supporter.identity_subject_hash = None
    supporter.identity_verified_at = None
    supporter.identity_verification_method = None
    supporter.identity_verified_by = None
    supporter.email = supporter.phone = supporter.ref_name = supporter.ref_phone = supporter.ref_email = supporter.ref_relationship = None
    invitation_result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.supporter_id == supporter_id,
        SupporterReferenceInvitation.deleted_at.is_(None),
    ))
    for invitation in invitation_result.scalars().all():
        invitation.status = "revoked"
        invitation.invitee_email_encrypted = encrypt_private_data({"revoked": True})
        invitation.response_encrypted = None
        invitation.deleted_at = datetime.now(timezone.utc)
    connection_result = await db.execute(select(PeerConnectRequest).where(
        PeerConnectRequest.supporter_id == supporter_id,
        PeerConnectRequest.status.in_(["pending", "accepted"]),
        PeerConnectRequest.deleted_at.is_(None),
    ))
    for connection in connection_result.scalars().all():
        await _transition_connection(db, connection, actor, "unavailable")
    _status_history(db, actor, "supporter", str(supporter_id), previous, "withdrawn")
    _audit(db, actor, "supporter.withdrawn", "supporter", str(supporter_id))
    await db.commit()
    return {"supporter_id": str(supporter_id), "status": "withdrawn", "private_data_deleted": True}


@router.post("/peer/requesters/{requester_id}/withdraw")
async def withdraw_requester(requester_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(requester_id))
    result = await db.execute(select(PeerRequester).where(PeerRequester.requester_id == requester_id, PeerRequester.deleted_at.is_(None)))
    requester = result.scalar_one_or_none()
    if not requester:
        raise HTTPException(status_code=404, detail="Requester not found.")
    requester.status = "withdrawn"
    requester.withdrawn_at = datetime.now(timezone.utc)
    requester.private_data_encrypted = encrypt_private_data({"withdrawn": True})
    requester.credential_hash = hash_peer_password(uuid.uuid4().hex + uuid.uuid4().hex)
    requester.identity_subject_hash = None
    requester.identity_verified_at = None
    requester.identity_verification_method = None
    requester.identity_verified_by = None
    connection_result = await db.execute(select(PeerConnectRequest).where(
        PeerConnectRequest.requester_id == requester_id,
        PeerConnectRequest.status.in_(["pending", "accepted"]),
        PeerConnectRequest.deleted_at.is_(None),
    ))
    for connection in connection_result.scalars().all():
        await _transition_connection(db, connection, actor, "canceled")
    _status_history(db, actor, "requester", str(requester_id), "active", "withdrawn")
    _audit(db, actor, "requester.withdrawn", "requester", str(requester_id))
    await db.commit()
    return {"requester_id": str(requester_id), "status": "withdrawn", "private_data_deleted": True}


@router.delete("/peer-signups/{supporter_id}")
async def delete_signup(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_administrator), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerSignup).where(PeerSignup.supporter_id == supporter_id, PeerSignup.deleted_at.is_(None)))
    supporter = result.scalar_one_or_none()
    if not supporter:
        raise HTTPException(status_code=404, detail="Supporter not found.")
    supporter.status = "deleted"
    supporter.approved = False
    supporter.deleted_at = datetime.now(timezone.utc)
    supporter.private_data_encrypted = None
    supporter.credential_hash = None
    supporter.identity_subject_hash = None
    supporter.identity_verified_at = None
    supporter.identity_verification_method = None
    supporter.identity_verified_by = None
    supporter.email = supporter.phone = supporter.ref_name = supporter.ref_phone = supporter.ref_email = supporter.ref_relationship = None
    supporter.name = "Deleted supporter"
    supporter.about = supporter.major = None
    supporter.locations = supporter.availability = supporter.interests = []
    invitation_result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.supporter_id == supporter_id,
        SupporterReferenceInvitation.deleted_at.is_(None),
    ))
    for invitation in invitation_result.scalars().all():
        invitation.status = "deleted"
        invitation.invitee_email_encrypted = encrypt_private_data({"deleted": True})
        invitation.response_encrypted = None
        invitation.deleted_at = datetime.now(timezone.utc)
    _status_history(db, actor, "supporter", str(supporter_id), None, "deleted")
    _audit(db, actor, "supporter.deleted", "supporter", str(supporter_id))
    await db.commit()
    return {"supporter_id": str(supporter_id), "status": "deleted", "private_data_deleted": True}


@router.delete("/peer-requests/{request_id}")
async def delete_request(request_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    if connection.status in {"pending", "accepted"}:
        raise HTTPException(status_code=409, detail="An active connection must be canceled, blocked, expired, or marked unavailable before deletion.")
    connection.deleted_at = datetime.now(timezone.utc)
    connection.status = "deleted"
    connection.private_data_encrypted = None
    connection.requester_name = connection.requester_email = connection.requester_phone = connection.preferred_location = connection.preferred_time = connection.message = None
    relay_result = await db.execute(select(PeerRelayMessage).where(PeerRelayMessage.request_id == request_id, PeerRelayMessage.deleted_at.is_(None)))
    for relay_message in relay_result.scalars().all():
        relay_message.body_encrypted = encrypt_private_data({"deleted": True})
        relay_message.deleted_at = datetime.now(timezone.utc)
    connection_report_result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.request_id == request_id, PeerConnectionReport.deleted_at.is_(None)))
    for connection_report in connection_report_result.scalars().all():
        connection_report.reason_encrypted = encrypt_private_data({"deleted": True})
        connection_report.deleted_at = datetime.now(timezone.utc)
        connection_report.status = "deleted"
    _status_history(db, actor, "connection_request", str(request_id), None, "deleted")
    _audit(db, actor, "connection.deleted", "connection_request", str(request_id))
    await db.commit()
    return {"request_id": str(request_id), "status": "deleted", "private_data_deleted": True}


@router.delete("/peer/connection-reports/{report_id}")
async def delete_connection_report(report_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.connection_report_id == report_id, PeerConnectionReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Connection report not found.")
    if report.status not in {"resolved", "dismissed", "duplicate"}:
        raise HTTPException(status_code=409, detail="An active safety report cannot be deleted before resolution.")
    now = datetime.now(timezone.utc)
    report.reason_encrypted = encrypt_private_data({"deleted": True})
    report.resolution_encrypted = None
    report.deleted_at = now
    report.status = "deleted"
    note_result = await db.execute(select(PeerModerationNote).where(PeerModerationNote.connection_report_id == report_id, PeerModerationNote.deleted_at.is_(None)))
    for note in note_result.scalars().all():
        note.note_encrypted = encrypt_private_data({"deleted": True})
        note.deleted_at = now
    _status_history(db, actor, "connection_report", str(report_id), None, "deleted")
    _audit(db, actor, "connection.report.deleted", "connection_report", str(report_id))
    await db.commit()
    return {"connection_report_id": str(report_id), "status": "deleted", "private_data_deleted": True}


@router.delete("/reports/{report_id}")
async def delete_report(report_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SupporterReport).where(SupporterReport.report_id == report_id, SupporterReport.deleted_at.is_(None)))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    report.deleted_at = datetime.now(timezone.utc)
    report.status = "deleted"
    report.private_data_encrypted = None
    report.reporter_email = report.reason = None
    _status_history(db, actor, "supporter_report", str(report_id), None, "deleted")
    _audit(db, actor, "report.deleted", "supporter_report", str(report_id))
    await db.commit()
    return {"report_id": str(report_id), "status": "deleted", "private_data_deleted": True}


@router.post("/peer/retention/purge")
async def purge_expired_peer_data(actor: PeerPrincipal = Depends(require_peer_administrator), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    purged = {"supporters": 0, "requesters": 0, "requests": 0, "reports": 0, "messages": 0, "blocks": 0, "connection_reports": 0, "moderation_notes": 0, "notifications": 0, "reference_invitations": 0}
    model_fields = (
        (PeerSignup, "supporters"),
        (PeerRequester, "requesters"),
        (PeerConnectRequest, "requests"),
        (SupporterReport, "reports"),
    )
    for model, label in model_fields:
        result = await db.execute(select(model).where(model.retention_expires_at <= now, model.deleted_at.is_(None)))
        for record in result.scalars().all():
            record.deleted_at = now
            record.status = "expired"
            if isinstance(record, PeerSignup):
                record.private_data_encrypted = None
                record.credential_hash = None
                record.identity_subject_hash = None
                record.identity_verified_at = None
                record.identity_verification_method = None
                record.identity_verified_by = None
                record.email = record.phone = record.ref_name = record.ref_phone = record.ref_email = record.ref_relationship = None
                record.name = "Expired supporter"
                record.about = record.major = None
                record.locations = record.availability = record.interests = []
                record.approved = False
            elif isinstance(record, PeerRequester):
                record.private_data_encrypted = encrypt_private_data({"expired": True})
                record.credential_hash = None
                record.identity_subject_hash = None
                record.identity_verified_at = None
                record.identity_verification_method = None
                record.identity_verified_by = None
            elif isinstance(record, PeerConnectRequest):
                record.private_data_encrypted = None
                record.requester_name = record.requester_email = record.requester_phone = record.preferred_location = record.preferred_time = record.message = None
            elif isinstance(record, SupporterReport):
                record.private_data_encrypted = None
                record.reporter_email = record.reason = None
            purged[label] += 1
    relay_result = await db.execute(select(PeerRelayMessage).where(PeerRelayMessage.retention_expires_at <= now, PeerRelayMessage.deleted_at.is_(None)))
    for relay_message in relay_result.scalars().all():
        relay_message.body_encrypted = encrypt_private_data({"expired": True})
        relay_message.deleted_at = now
        purged["messages"] += 1
    block_result = await db.execute(select(PeerBlock).where(PeerBlock.retention_expires_at <= now, PeerBlock.deleted_at.is_(None)))
    for block in block_result.scalars().all():
        block.active = False
        block.deleted_at = now
        purged["blocks"] += 1
    connection_report_result = await db.execute(select(PeerConnectionReport).where(PeerConnectionReport.retention_expires_at <= now, PeerConnectionReport.deleted_at.is_(None)))
    for connection_report in connection_report_result.scalars().all():
        connection_report.reason_encrypted = encrypt_private_data({"expired": True})
        connection_report.resolution_encrypted = None
        connection_report.status = "expired"
        connection_report.deleted_at = now
        purged["connection_reports"] += 1
    note_result = await db.execute(select(PeerModerationNote).where(PeerModerationNote.retention_expires_at <= now, PeerModerationNote.deleted_at.is_(None)))
    for note in note_result.scalars().all():
        note.note_encrypted = encrypt_private_data({"expired": True})
        note.deleted_at = now
        purged["moderation_notes"] += 1
    notification_result = await db.execute(select(PeerNotification).where(PeerNotification.retention_expires_at <= now, PeerNotification.deleted_at.is_(None)))
    for notification in notification_result.scalars().all():
        notification.provider_message_id = None
        notification.last_error_code = None
        notification.deleted_at = now
        notification.status = "expired"
        purged["notifications"] += 1
    invitation_result = await db.execute(select(SupporterReferenceInvitation).where(
        SupporterReferenceInvitation.expires_at <= now,
        SupporterReferenceInvitation.deleted_at.is_(None),
    ))
    for invitation in invitation_result.scalars().all():
        invitation.status = "expired"
        invitation.invitee_email_encrypted = encrypt_private_data({"expired": True})
        invitation.response_encrypted = None
        invitation.deleted_at = now
        purged["reference_invitations"] += 1
    audit_result = await db.execute(delete(PeerAuditLog).where(PeerAuditLog.retention_expires_at <= now))
    history_result = await db.execute(delete(PeerStatusHistory).where(PeerStatusHistory.retention_expires_at <= now))
    rate_result = await db.execute(delete(RateLimitBucket).where(RateLimitBucket.expires_at <= now))
    purged["audit_logs"] = int(audit_result.rowcount or 0)
    purged["status_history"] = int(history_result.rowcount or 0)
    purged["rate_limit_buckets"] = int(rate_result.rowcount or 0)
    _audit(db, actor, "retention.purged", "peer_data", "expired", purged)
    await db.commit()
    return {"status": "purged", "records": purged}


@router.get("/peer/status-history/{entity_id}")
async def get_status_history(entity_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_workflow), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(entity_id))
    result = await db.execute(select(PeerStatusHistory).where(PeerStatusHistory.entity_id == str(entity_id)).order_by(PeerStatusHistory.changed_at.asc()))
    _audit(db, actor, "status_history.read", "peer_entity", str(entity_id))
    await db.commit()
    return [{"entity_type": item.entity_type, "previous_status": item.previous_status, "new_status": item.new_status, "changed_at": item.changed_at.isoformat() if item.changed_at else None} for item in result.scalars().all()]
