from __future__ import annotations

import re

from app import auth
from app.config import settings
from app.services.peer_security import valid_fernet_key


PEER_APPROVAL_VERSION = "2026-08-03"
_EMAIL = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


def peer_readiness_blockers() -> list[str]:
    blockers: list[str] = []
    if len(settings.PEER_AUTH_SECRET) < 32 or settings.PEER_AUTH_SECRET.startswith("replace-"):
        blockers.append("peer authentication secret")
    if not valid_fernet_key(settings.PEER_PII_ENCRYPTION_KEY):
        blockers.append("peer PII encryption key")
    if len(settings.PEER_SAFETY_CONTACT_EMAIL) > 254 or not _EMAIL.fullmatch(settings.PEER_SAFETY_CONTACT_EMAIL):
        blockers.append("monitored safety contact email")
    approvals = {
        "safety approval": settings.PEER_SAFETY_APPROVAL_ID,
        "privacy approval": settings.PEER_PRIVACY_APPROVAL_ID,
        "security approval": settings.PEER_SECURITY_APPROVAL_ID,
        "operations approval": settings.PEER_OPERATIONS_APPROVAL_ID,
    }
    blockers.extend(label for label, value in approvals.items() if len(value.strip()) < 8)
    if settings.PEER_APPROVAL_VERSION != PEER_APPROVAL_VERSION:
        blockers.append("current approval version")
    if not auth.CORNELL_IDENTITY_INTEGRATION_IMPLEMENTED:
        blockers.append("Cornell identity-provider integration")
    return blockers


def peer_readiness_status() -> dict:
    blockers = peer_readiness_blockers()
    return {
        "ready": not blockers,
        "approval_version": PEER_APPROVAL_VERSION,
        "blockers": blockers,
        "public_feature_enabled": bool(settings.FEATURE_PEER_CONNECT and not blockers),
    }
