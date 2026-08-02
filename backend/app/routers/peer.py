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
    PeerConnectRequest,
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
AUDIT_METADATA_KEYS = {"supporter_id", "invitation_id", "from", "to", "reason_code", "supporters", "requesters", "requests", "reports", "reference_invitations", "audit_logs", "status_history", "rate_limit_buckets"}


def require_peer_connect() -> None:
    if not settings.FEATURE_PEER_CONNECT:
        raise HTTPException(status_code=503, detail="Peer Connect is unavailable pending safety review.")


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
        return _email(value)

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
    preferred_location: str = Field(min_length=1, max_length=120)
    preferred_time: str = Field(min_length=1, max_length=100)
    message: str | None = Field(default=None, max_length=500)

    @field_validator("preferred_location", "preferred_time", "message")
    @classmethod
    def validate_text(cls, value: str | None, info) -> str | None:
        return _safe_text(value, info.field_name) if value is not None else None


class ReportRequest(StrictPeerModel):
    supporter_id: uuid.UUID
    reason: str = Field(min_length=10, max_length=500)

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, value: str) -> str:
        return _safe_text(value, "reason")


class StatusRequest(StrictPeerModel):
    status: Literal["pending", "accepted", "declined", "resolved", "closed"]


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _expires(days: int) -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=days)


def _send_email(to: str, template: Literal["application", "approval", "connection", "report"], record_id: str) -> None:
    if not settings.RESEND_API_KEY or not to or not EMAIL_RE.fullmatch(to) or "\r" in to or "\n" in to:
        return
    subject_by_template = {
        "application": "New CornellPulse supporter application",
        "approval": "CornellPulse supporter application update",
        "connection": "New CornellPulse peer connection request",
        "report": "New CornellPulse peer safety report",
    }
    body = f"<p>A CornellPulse peer workflow record requires attention.</p><p>Reference: <code>{email_html(record_id)}</code></p>"
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({"from": FROM_EMAIL, "to": to, "subject": subject_by_template[template], "html": body})
    except Exception:
        # Do not log recipient addresses, provider payloads, or user content.
        return


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


def _request_private(connection: PeerConnectRequest) -> dict:
    return decrypt_private_data(connection.private_data_encrypted) if connection.private_data_encrypted else {
        "requester_name": connection.requester_name,
        "requester_email": connection.requester_email,
        "requester_phone": connection.requester_phone,
        "preferred_location": connection.preferred_location,
        "preferred_time": connection.preferred_time,
        "message": connection.message,
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


@router.get("/peer/supporter-policy", dependencies=[Depends(require_supporter_signup)])
async def get_supporter_policy():
    return SUPPORTER_POLICY


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
    return {"requester_id": str(requester_id), "access_token": create_peer_token("requester", str(requester_id)), "token_type": "bearer"}


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
    private = _supporter_private(supporter)
    _audit(db, actor, "supporter.private.read", "supporter", str(supporter_id))
    await db.commit()
    return {**public_supporter_dict(supporter), "status": supporter.status, "private_contact": {"email": private.get("email"), "phone": private.get("phone")}, **({"reference": {key: private.get(key) for key in ("reference_name", "reference_phone", "reference_email", "reference_relationship")}} if actor.role == "administrator" else {})}


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
    requester = await _active_requester(db, requester_id)
    await _active_supporter(db, payload.supporter_id, approved=True)
    request_id = uuid.uuid4()
    connection = PeerConnectRequest(
        request_id=request_id,
        supporter_id=payload.supporter_id,
        requester_id=requester_id,
        private_data_encrypted=encrypt_private_data({
            **decrypt_private_data(requester.private_data_encrypted),
            "preferred_location": payload.preferred_location,
            "preferred_time": payload.preferred_time,
            "message": payload.message,
        }),
        status="pending",
        retention_expires_at=_expires(settings.PEER_REQUEST_RETENTION_DAYS),
    )
    db.add(connection)
    _status_history(db, actor, "connection_request", str(request_id), None, "pending")
    _audit(db, actor, "connection.created", "connection_request", str(request_id), {"supporter_id": str(payload.supporter_id)})
    await db.commit()
    _send_email(settings.ADMIN_EMAIL, "connection", str(request_id))
    return {"request_id": str(request_id), "supporter_id": str(payload.supporter_id), "status": "pending"}


@router.get("/peer-requests")
async def get_requests(actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.deleted_at.is_(None)).order_by(PeerConnectRequest.requested_at.desc()))
    response = []
    for connection in result.scalars().all():
        item = {"request_id": str(connection.request_id), "supporter_id": str(connection.supporter_id), "requester_id": str(connection.requester_id), "status": connection.status, "requested_at": connection.requested_at.isoformat() if connection.requested_at else None}
        if actor.role == "administrator":
            item["private"] = _request_private(connection)
        response.append(item)
    _audit(db, actor, "connections.read", "connection_collection", "all")
    await db.commit()
    return response


@router.get("/peer/supporters/{supporter_id}/requests")
async def get_supporter_requests(supporter_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(supporter_id))
    if actor.role == "supporter":
        await _active_supporter(db, supporter_id, approved=True)
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.supporter_id == supporter_id, PeerConnectRequest.deleted_at.is_(None)).order_by(PeerConnectRequest.requested_at.desc()))
    response = []
    for connection in result.scalars().all():
        item = {"request_id": str(connection.request_id), "supporter_id": str(connection.supporter_id), "status": connection.status, "requested_at": connection.requested_at.isoformat() if connection.requested_at else None}
        if actor.role in {"supporter", "administrator"}:
            item["requester_contact"] = _request_private(connection)
        response.append(item)
    _audit(db, actor, "supporter.connections.read", "supporter", str(supporter_id))
    await db.commit()
    return response


@router.get("/peer/requesters/{requester_id}/requests")
async def get_requester_requests(requester_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    authorize_self_or_staff(actor, str(requester_id))
    if actor.role == "requester":
        await _active_requester(db, requester_id)
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.requester_id == requester_id, PeerConnectRequest.deleted_at.is_(None)).order_by(PeerConnectRequest.requested_at.desc()))
    response = [{"request_id": str(connection.request_id), "supporter_id": str(connection.supporter_id), "status": connection.status, "requested_at": connection.requested_at.isoformat() if connection.requested_at else None} for connection in result.scalars().all()]
    _audit(db, actor, "requester.connections.read", "requester", str(requester_id))
    await db.commit()
    return response


@router.post("/peer-requests/{request_id}/resolve")
async def resolve_request(request_id: uuid.UUID, actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    return await _change_request_status(request_id, "resolved", actor, db)


@router.post("/peer-requests/{request_id}/status")
async def update_request_status(request_id: uuid.UUID, payload: StatusRequest, actor: PeerPrincipal = Depends(require_peer_actor), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
    connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    if actor.role == "requester" and (str(connection.requester_id) != actor.subject_id or payload.status not in {"closed"}):
        raise HTTPException(status_code=403, detail="Requester may close only their own request.")
    if actor.role == "supporter" and (str(connection.supporter_id) != actor.subject_id or payload.status not in {"accepted", "declined"}):
        raise HTTPException(status_code=403, detail="Supporter may respond only to their own request.")
    if actor.role == "requester":
        await _active_requester(db, uuid.UUID(actor.subject_id))
    if actor.role == "supporter":
        await _active_supporter(db, uuid.UUID(actor.subject_id), approved=True)
    if actor.role not in {"requester", "supporter", "moderator", "administrator"}:
        raise HTTPException(status_code=403, detail="Not authorized to update this request.")
    return await _change_request_status(request_id, payload.status, actor, db, connection)


async def _change_request_status(request_id: uuid.UUID, new_status: str, actor: PeerPrincipal, db: AsyncSession, connection: PeerConnectRequest | None = None):
    if connection is None:
        result = await db.execute(select(PeerConnectRequest).where(PeerConnectRequest.request_id == request_id, PeerConnectRequest.deleted_at.is_(None)))
        connection = result.scalar_one_or_none()
    if not connection:
        raise HTTPException(status_code=404, detail="Connection request not found.")
    previous = connection.status
    connection.status = new_status
    _status_history(db, actor, "connection_request", str(request_id), previous, new_status)
    _audit(db, actor, "connection.status_changed", "connection_request", str(request_id), {"from": previous, "to": new_status})
    await db.commit()
    return {"request_id": str(request_id), "status": new_status}


@router.post("/report-supporter", dependencies=[Depends(require_peer_connect)], status_code=201)
async def report_supporter(payload: ReportRequest, request: Request, actor: PeerPrincipal = Depends(require_requester), db: AsyncSession = Depends(get_db)):
    await enforce_persistent_rate_limit(db, "supporter-report", actor.subject_id, 3, settings.PEER_RATE_LIMIT_WINDOW_SECONDS)
    await _active_requester(db, uuid.UUID(actor.subject_id))
    await _active_supporter(db, payload.supporter_id, approved=True)
    report_id = uuid.uuid4()
    report = SupporterReport(
        report_id=report_id,
        supporter_id=payload.supporter_id,
        reporter_id=uuid.UUID(actor.subject_id),
        private_data_encrypted=encrypt_private_data({"reason": payload.reason}),
        status="open",
        resolved=False,
        retention_expires_at=_expires(settings.PEER_REPORT_RETENTION_DAYS),
    )
    db.add(report)
    _status_history(db, actor, "supporter_report", str(report_id), None, "open")
    _audit(db, actor, "report.created", "supporter_report", str(report_id), {"supporter_id": str(payload.supporter_id)})
    await db.commit()
    _send_email(settings.ADMIN_EMAIL, "report", str(report_id))
    return {"report_id": str(report_id), "status": "open"}


@router.get("/reports")
async def get_reports(actor: PeerPrincipal = Depends(require_peer_staff), _: None = Depends(require_peer_connect), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SupporterReport).where(SupporterReport.deleted_at.is_(None)).order_by(SupporterReport.reported_at.desc()))
    response = []
    for report in result.scalars().all():
        private = decrypt_private_data(report.private_data_encrypted) if report.private_data_encrypted else {"reason": report.reason, "reporter_email": report.reporter_email}
        response.append({"report_id": str(report.report_id), "supporter_id": str(report.supporter_id), "status": report.status, "reported_at": report.reported_at.isoformat() if report.reported_at else None, "private": {"reason": private.get("reason"), **({"reporter_email": private.get("reporter_email")} if actor.role == "administrator" else {})}})
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
    connection.deleted_at = datetime.now(timezone.utc)
    connection.status = "deleted"
    connection.private_data_encrypted = None
    connection.requester_name = connection.requester_email = connection.requester_phone = connection.preferred_location = connection.preferred_time = connection.message = None
    _status_history(db, actor, "connection_request", str(request_id), None, "deleted")
    _audit(db, actor, "connection.deleted", "connection_request", str(request_id))
    await db.commit()
    return {"request_id": str(request_id), "status": "deleted", "private_data_deleted": True}


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
    purged = {"supporters": 0, "requesters": 0, "requests": 0, "reports": 0, "reference_invitations": 0}
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
            elif isinstance(record, PeerConnectRequest):
                record.private_data_encrypted = None
                record.requester_name = record.requester_email = record.requester_phone = record.preferred_location = record.preferred_time = record.message = None
            elif isinstance(record, SupporterReport):
                record.private_data_encrypted = None
                record.reporter_email = record.reason = None
            purged[label] += 1
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
