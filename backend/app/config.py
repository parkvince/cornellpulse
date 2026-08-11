import json
import os
from pathlib import Path
from secrets import token_urlsafe

from cryptography.fernet import Fernet
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://cpulse_user@localhost:5432/cornellpulse"
    ADMIN_SESSION_SECRET: str = ""
    ADMIN_PASSWORD_HASH: str = ""
    ADMIN_SESSION_MINUTES: int = 15
    ADMIN_LOGIN_MAX_ATTEMPTS: int = 5
    ADMIN_LOGIN_WINDOW_SECONDS: int = 900
    PEER_AUTH_SECRET: str = ""
    PEER_TOKEN_MINUTES: int = 15
    MODERATOR_PASSWORD_HASH: str = ""
    PEER_PII_ENCRYPTION_KEY: str = ""
    PEER_SUPPORTER_RETENTION_DAYS: int = 365
    PEER_REQUEST_RETENTION_DAYS: int = 90
    PEER_REPORT_RETENTION_DAYS: int = 365
    PEER_AUDIT_RETENTION_DAYS: int = 365
    PEER_RATE_LIMIT_WINDOW_SECONDS: int = 3600
    PEER_REFERENCE_INVITATION_DAYS: int = 14
    PEER_REQUEST_RESPONSE_HOURS: int = 72
    PEER_RELAY_RETENTION_DAYS: int = 90
    PEER_BLOCK_RETENTION_DAYS: int = 365
    PEER_MODERATION_NOTE_RETENTION_DAYS: int = 365
    PEER_NOTIFICATION_RETENTION_DAYS: int = 90
    PEER_SAFETY_CONTACT_EMAIL: str = ""
    PEER_APPROVAL_VERSION: str = ""
    PEER_SAFETY_APPROVAL_ID: str = ""
    PEER_PRIVACY_APPROVAL_ID: str = ""
    PEER_SECURITY_APPROVAL_ID: str = ""
    PEER_OPERATIONS_APPROVAL_ID: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "dev"
    RESEND_API_KEY: str = ""
    EMAIL_TIMEOUT_SECONDS: int = 8
    ADMIN_EMAIL: str = ""
    REDIS_URL: str = ""
    REDIS_REQUIRED: bool = False
    AGGREGATE_MAX_CONTRIBUTIONS_PER_HOUR: int = 8
    AGGREGATE_RECEIPT_RETENTION_DAYS: int = 2
    AGGREGATE_RETENTION_DAYS: int = 30
    RESOURCE_CLICK_RETENTION_DAYS: int = 30
    TECHNICAL_LOG_RETENTION_DAYS: int = 14
    PUSH_SUBSCRIBER_RETENTION_DAYS: int = 90
    ACADEMIC_CALENDAR_RETENTION_DAYS: int = 365
    RETENTION_SWEEP_INTERVAL_MINUTES: int = 60
    AGGREGATE_SIGNING_SECRET: str = ""
    PRIVACY_CONTACT_EMAIL: str = ""
    FEATURE_PEER_CONNECT: bool = False
    FEATURE_SUPPORTER_SIGNUP: bool = False
    PEER_SANDBOX_MODE: bool = False

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

settings = Settings()


def _configure_local_peer_sandbox() -> None:
    """Create ignored local credentials for the explicitly enabled dev sandbox."""
    if not settings.PEER_SANDBOX_MODE or settings.is_production:
        return
    secret_path = Path(__file__).resolve().parents[1] / ".peer-sandbox-secrets.json"
    try:
        stored = json.loads(secret_path.read_text(encoding="utf-8")) if secret_path.exists() else {}
    except (OSError, json.JSONDecodeError):
        stored = {}
    if not isinstance(stored, dict):
        stored = {}
    changed = False
    if not isinstance(stored.get("peer_auth_secret"), str) or len(stored["peer_auth_secret"]) < 32:
        stored["peer_auth_secret"] = token_urlsafe(48)
        changed = True
    try:
        Fernet(str(stored.get("peer_pii_encryption_key", "")).encode("ascii"))
    except (ValueError, UnicodeEncodeError):
        stored["peer_pii_encryption_key"] = Fernet.generate_key().decode("ascii")
        changed = True
    if changed or not secret_path.exists():
        secret_path.write_text(json.dumps(stored, separators=(",", ":")), encoding="utf-8")
        try:
            os.chmod(secret_path, 0o600)
        except OSError:
            pass
    if len(settings.PEER_AUTH_SECRET) < 32 or settings.PEER_AUTH_SECRET.startswith("replace-"):
        settings.PEER_AUTH_SECRET = str(stored["peer_auth_secret"])
    settings.PEER_PII_ENCRYPTION_KEY = str(stored["peer_pii_encryption_key"])


_configure_local_peer_sandbox()
