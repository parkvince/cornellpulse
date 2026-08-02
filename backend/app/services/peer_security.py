import json
from html import escape
from typing import Any

import bcrypt
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, status

from app.config import settings


def valid_fernet_key(value: str) -> bool:
    try:
        Fernet(value.encode("ascii"))
        return True
    except (ValueError, UnicodeEncodeError):
        return False


def _fernet() -> Fernet:
    if not valid_fernet_key(settings.PEER_PII_ENCRYPTION_KEY):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Peer private-data protection is not configured.",
        )
    return Fernet(settings.PEER_PII_ENCRYPTION_KEY.encode("ascii"))


def encrypt_private_data(data: dict[str, Any]) -> str:
    payload = json.dumps(data, separators=(",", ":"), sort_keys=True, ensure_ascii=False).encode("utf-8")
    return _fernet().encrypt(payload).decode("ascii")


def decrypt_private_data(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        decoded = _fernet().decrypt(value.encode("ascii"))
        parsed = json.loads(decoded.decode("utf-8"))
    except (InvalidToken, ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail="Protected peer data could not be read.") from exc
    return parsed if isinstance(parsed, dict) else {}


def hash_peer_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("ascii")


def verify_peer_password(password: str, password_hash: str | None) -> bool:
    if not password_hash or not password_hash.startswith(("$2a$", "$2b$", "$2y$")):
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, UnicodeError):
        return False


def email_html(value: object) -> str:
    """Escape user-controlled content before inserting it in HTML email."""
    return escape(str(value), quote=True)


def public_supporter_dict(supporter: object) -> dict[str, Any]:
    """The only serializer permitted for the unauthenticated supporter directory."""
    return {
        "supporter_id": str(getattr(supporter, "supporter_id")),
        "display_name": getattr(supporter, "name"),
        "year": getattr(supporter, "year"),
        "major": getattr(supporter, "major"),
        "locations": getattr(supporter, "locations") or [],
        "availability": getattr(supporter, "availability") or [],
        "interests": getattr(supporter, "interests") or [],
        "about": getattr(supporter, "about"),
    }
