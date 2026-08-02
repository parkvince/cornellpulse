from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://cpulse_user:yourpassword@localhost:5432/cornellpulse"
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
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "dev"
    RESEND_API_KEY: str = ""
    ADMIN_EMAIL: str = ""
    FEATURE_PEER_CONNECT: bool = False
    FEATURE_SUPPORTER_SIGNUP: bool = False

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.strip().lower() == "production"

settings = Settings()
