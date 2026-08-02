from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from hmac import compare_digest
from secrets import token_urlsafe
from threading import Lock

import bcrypt
from fastapi import HTTPException, Request, Response, status
from jose import JWTError, jwt

from app.config import settings


ADMIN_COOKIE_NAME = "cornellpulse_admin_session"
ADMIN_TOKEN_ALGORITHM = "HS256"
ADMIN_TOKEN_AUDIENCE = "cornellpulse-admin"
ADMIN_TOKEN_ISSUER = "cornellpulse-api"

_login_attempts: dict[str, deque[datetime]] = defaultdict(deque)
_login_attempts_lock = Lock()


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


def enforce_login_rate_limit(client_ip: str) -> None:
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(seconds=settings.ADMIN_LOGIN_WINDOW_SECONDS)
    with _login_attempts_lock:
        attempts = _login_attempts[client_ip]
        while attempts and attempts[0] <= cutoff:
            attempts.popleft()
        if len(attempts) >= settings.ADMIN_LOGIN_MAX_ATTEMPTS:
            retry_after = max(1, int((attempts[0] - cutoff).total_seconds()))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        attempts.append(now)


def clear_login_attempts(client_ip: str) -> None:
    with _login_attempts_lock:
        _login_attempts.pop(client_ip, None)


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
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired administrator session.") from exc

    if not compare_digest(str(claims.get("sub", "")), "administrator"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administrator access required.")
