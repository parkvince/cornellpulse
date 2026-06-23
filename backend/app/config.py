from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://cpulse_user:yourpassword@localhost:5432/cornellpulse"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    ADMIN_PASSWORD_HASH: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    ENVIRONMENT: str = "dev"
    RESEND_API_KEY: str = ""
    ADMIN_EMAIL: str = ""

    class Config:
        env_file = ".env"

settings = Settings()