from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hmac import compare_digest
from secrets import token_urlsafe
from typing import Literal

import bcrypt
import jwt
from fastapi import HTTPException, Request, Response, status
from jwt import InvalidTokenError

from app.config import settings
from app.services.peer_security import valid_fernet_key


ADMIN_COOKIE_NAME = "cornellpulse_admin_session"
ADMIN_TOKEN_ALGORITHM = "HS256"
ADMIN_TOKEN_AUDIENCE = "cornellpulse-admin"
ADMIN_TOKEN_ISSUER = "cornellpulse-api"
PEER_TOKEN_AUDIENCE = "cornellpulse-peer"
PeerRole = Literal["supporter", "requester", "moderator", "administrator"]
CORNELL_IDENTITY_INTEGRATION_IMPLEMENTED = False


@dataclass(frozen=True)
class PeerPrincipal:
    subject_id: str
    role: PeerRole


def validate_security_settings() -> None:
    if not settings.is_production:
        return

    errors = []
    if len(settings.ADMIN_SESSION_SECRET) < 32 or settings.ADMIN_SESSION_SECRET.startswith("replace-"):
        errors.append("ADMIN_SESSION_SECRET must be a random value of at least 32 characters")
    if not is_valid_password_hash(settings.ADMIN_PASSWORD_HASH):
        errors.append("ADMIN_PASSWORD_HASH must be a valid bcrypt hash")
    if not settings.FRONTEND_URL.startswith("https://"):
        errors.append("FRONTEND_URL must use HTTPS in production")
    if not settings.DATABASE_URL.startswith("postgresql+asyncpg://") or "yourpassword" in settings.DATABASE_URL.lower():
        errors.append("DATABASE_URL must be a non-placeholder PostgreSQL async URL")
    if settings.REDIS_REQUIRED and not settings.REDIS_URL:
        errors.append("REDIS_URL is required when REDIS_REQUIRED is enabled")
    if any(value < 1 for value in (settings.AGGREGATE_MAX_CONTRIBUTIONS_PER_HOUR, settings.AGGREGATE_RECEIPT_RETENTION_DAYS, settings.AGGREGATE_RETENTION_DAYS, settings.RESOURCE_CLICK_RETENTION_DAYS, settings.TECHNICAL_LOG_RETENTION_DAYS, settings.PUSH_SUBSCRIBER_RETENTION_DAYS, settings.ACADEMIC_CALENDAR_RETENTION_DAYS, settings.RETENTION_SWEEP_INTERVAL_MINUTES, settings.EMAIL_TIMEOUT_SECONDS)):
        errors.append("Abuse limits and retention periods must be positive")
    if len(settings.AGGREGATE_SIGNING_SECRET) < 32 or settings.AGGREGATE_SIGNING_SECRET.startswith("replace-"):
        errors.append("AGGREGATE_SIGNING_SECRET must be a random value of at least 32 characters")
    if "@" not in settings.PRIVACY_CONTACT_EMAIL or settings.PRIVACY_CONTACT_EMAIL.endswith("@example.com"):
        errors.append("PRIVACY_CONTACT_EMAIL must be a monitored non-placeholder email address")
    if settings.FEATURE_PEER_CONNECT or settings.FEATURE_SUPPORTER_SIGNUP:
        if len(settings.PEER_AUTH_SECRET) < 32 or settings.PEER_AUTH_SECRET.startswith("replace-"):
            errors.append("PEER_AUTH_SECRET must be a separate random value of at least 32 characters")
        if not valid_fernet_key(settings.PEER_PII_ENCRYPTION_KEY):
            errors.append("PEER_PII_ENCRYPTION_KEY must be a valid Fernet key")
        if not is_valid_password_hash(settings.MODERATOR_PASSWORD_HASH):
            errors.append("MODERATOR_PASSWORD_HASH must be a valid bcrypt hash")
        retention_values = (
            settings.PEER_SUPPORTER_RETENTION_DAYS,
            settings.PEER_REQUEST_RETENTION_DAYS,
            settings.PEER_REPORT_RETENTION_DAYS,
            settings.PEER_AUDIT_RETENTION_DAYS,
            settings.PEER_RATE_LIMIT_WINDOW_SECONDS,
            settings.PEER_REFERENCE_INVITATION_DAYS,
            settings.PEER_REQUEST_RESPONSE_HOURS,
            settings.PEER_RELAY_RETENTION_DAYS,
            settings.PEER_BLOCK_RETENTION_DAYS,
            settings.PEER_MODERATION_NOTE_RETENTION_DAYS,
            settings.PEER_NOTIFICATION_RETENTION_DAYS,
        )
        if any(value < 1 for value in retention_values):
            errors.append("Peer retention and rate-limit settings must be positive")
        if not CORNELL_IDENTITY_INTEGRATION_IMPLEMENTED:
            errors.append("Peer Connect and supporter signup cannot be enabled in production until Cornell identity verification is integrated")
        if "@" not in settings.PEER_SAFETY_CONTACT_EMAIL:
            errors.append("PEER_SAFETY_CONTACT_EMAIL must be a monitored email address")
        if not settings.RESEND_API_KEY or settings.RESEND_API_KEY.startswith("replace-"):
            errors.append("RESEND_API_KEY is required when a peer feature is enabled")
        if settings.PEER_APPROVAL_VERSION != "2026-08-03":
            errors.append("PEER_APPROVAL_VERSION must match the current safety-operations version")
        approval_ids = (
            settings.PEER_SAFETY_APPROVAL_ID,
            settings.PEER_PRIVACY_APPROVAL_ID,
            settings.PEER_SECURITY_APPROVAL_ID,
            settings.PEER_OPERATIONS_APPROVAL_ID,
        )
        if any(len(value.strip()) < 8 for value in approval_ids):
            errors.append("Peer safety, privacy, security, and operations approval identifiers are required")

    if errors:
        raise RuntimeError("Invalid production security configuration: " + "; ".join(errors))


def is_valid_password_hash(value: str) -> bool:
    return value.startswith(("$2a$", "$2b$", "$2y$")) and len(value) == 60


def verify_admin_password(password: str) -> bool:
    if not password or not is_valid_password_hash(settings.ADMIN_PASSWORD_HASH):
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), settings.ADMIN_PASSWORD_HASH.encode("utf-8"))
    except ValueError:
        return False


def create_admin_token() -> str:
    if len(settings.ADMIN_SESSION_SECRET) < 32:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Administrator authentication is not configured.",
        )
    now = datetime.now(timezone.utc)
    expires = now + timedelta(minutes=settings.ADMIN_SESSION_MINUTES)
    return jwt.encode(
        {
            "sub": "administrator",
            "aud": ADMIN_TOKEN_AUDIENCE,
            "iss": ADMIN_TOKEN_ISSUER,
            "iat": now,
            "exp": expires,
            "jti": token_urlsafe(16),
        },
        settings.ADMIN_SESSION_SECRET,
        algorithm=ADMIN_TOKEN_ALGORITHM,
    )


def set_admin_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ADMIN_COOKIE_NAME,
        value=token,
        max_age=settings.ADMIN_SESSION_MINUTES * 60,
        httponly=True,
        secure=settings.is_production,
        samesite="strict",
        path="/api/v1",
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(
        key=ADMIN_COOKIE_NAME,
        httponly=True,
        secure=settings.is_production,
        samesite="strict",
        path="/api/v1",
    )


def require_admin(request: Request) -> None:
    token = request.cookies.get(ADMIN_COOKIE_NAME)
    if not token or not settings.ADMIN_SESSION_SECRET:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Administrator authentication required.")

    try:
        claims = jwt.decode(
            token,
            settings.ADMIN_SESSION_SECRET,
            algorithms=[ADMIN_TOKEN_ALGORITHM],
            audience=ADMIN_TOKEN_AUDIENCE,
            issuer=ADMIN_TOKEN_ISSUER,
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired administrator session.") from exc

    if not compare_digest(str(claims.get("sub", "")), "administrator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")


def create_peer_token(role: PeerRole, subject_id: str) -> str:
    if len(settings.PEER_AUTH_SECRET) < 32:
        raise HTTPException(status_code=503, detail="Peer authentication is not configured.")
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": subject_id,
            "role": role,
            "aud": PEER_TOKEN_AUDIENCE,
            "iss": ADMIN_TOKEN_ISSUER,
            "iat": now,
            "exp": now + timedelta(minutes=settings.PEER_TOKEN_MINUTES),
            "jti": token_urlsafe(16),
        },
        settings.PEER_AUTH_SECRET,
        algorithm=ADMIN_TOKEN_ALGORITHM,
    )


def peer_principal_from_request(request: Request) -> PeerPrincipal:
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token or not settings.PEER_AUTH_SECRET:
        raise HTTPException(status_code=401, detail="Peer authentication required.")
    try:
        claims = jwt.decode(
            token,
            settings.PEER_AUTH_SECRET,
            algorithms=[ADMIN_TOKEN_ALGORITHM],
            audience=PEER_TOKEN_AUDIENCE,
            issuer=ADMIN_TOKEN_ISSUER,
        )
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired peer session.") from exc
    role = str(claims.get("role", ""))
    subject_id = str(claims.get("sub", ""))
    if role not in {"supporter", "requester", "moderator", "administrator"} or not subject_id or len(subject_id) > 64:
        raise HTTPException(status_code=401, detail="Invalid peer session claims.")
    return PeerPrincipal(subject_id=subject_id, role=role)  # type: ignore[arg-type]


def require_peer_actor(request: Request) -> PeerPrincipal:
    try:
        require_admin(request)
        return PeerPrincipal(subject_id="administrator", role="administrator")
    except HTTPException:
        return peer_principal_from_request(request)


def require_peer_staff(request: Request) -> PeerPrincipal:
    principal = require_peer_actor(request)
    if principal.role not in {"moderator", "administrator"}:
        raise HTTPException(status_code=403, detail="Moderator or administrator access required.")
    return principal


def require_peer_administrator(request: Request) -> PeerPrincipal:
    principal = require_peer_actor(request)
    if principal.role != "administrator":
        raise HTTPException(status_code=403, detail="Administrator access required.")
    return principal


def require_requester(request: Request) -> PeerPrincipal:
    principal = peer_principal_from_request(request)
    if principal.role != "requester":
        raise HTTPException(status_code=403, detail="Requester access required.")
    return principal


def require_supporter(request: Request) -> PeerPrincipal:
    principal = peer_principal_from_request(request)
    if principal.role != "supporter":
        raise HTTPException(status_code=403, detail="Supporter access required.")
    return principal


def authorize_self_or_staff(principal: PeerPrincipal, subject_id: str) -> None:
    if principal.role not in {"moderator", "administrator"} and not compare_digest(principal.subject_id, subject_id):
        raise HTTPException(status_code=403, detail="You may access only your own peer record.")
