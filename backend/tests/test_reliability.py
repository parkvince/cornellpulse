import logging
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import auth
from app.config import settings
from app.main import app
from app.middleware import PrivacySafeErrorMiddleware, SecurityHeadersMiddleware
from app.services import readiness


def test_liveness_does_not_claim_dependency_readiness():
    with patch("app.main.init_db", new_callable=AsyncMock):
        with TestClient(app) as client:
            response = client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


def test_readiness_returns_503_and_component_evidence_for_partial_outage():
    report = {
        "status": "not_ready",
        "components": {
            "postgresql": {"status": "unavailable", "required": True},
            "redis": {"status": "ready", "required": False},
            "email": {"status": "configured", "required": False},
            "configuration": {"status": "ready", "required": True},
        },
    }
    with (
        patch("app.main.init_db", new_callable=AsyncMock),
        patch("app.main.readiness_report", new=AsyncMock(return_value=report)),
    ):
        with TestClient(app) as client:
            response = client.get("/api/v1/health/ready")
    assert response.status_code == 503
    assert response.json() == report


@pytest.mark.asyncio
async def test_postgresql_probe_fails_closed_without_leaking_exception_text(monkeypatch):
    class BrokenEngine:
        def connect(self):
            raise RuntimeError("postgresql://user:secret@example.invalid/private")

    monkeypatch.setattr(readiness, "engine", BrokenEngine())
    assert await readiness._postgres_status() == {"status": "unavailable", "required": True}


@pytest.mark.asyncio
async def test_redis_and_email_required_configuration_fail_readiness(monkeypatch):
    monkeypatch.setattr(settings, "REDIS_URL", "")
    monkeypatch.setattr(settings, "REDIS_REQUIRED", True)
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", True)
    monkeypatch.setattr(settings, "RESEND_API_KEY", "")
    monkeypatch.setattr(settings, "PEER_SAFETY_CONTACT_EMAIL", "operator@example.com")
    assert await readiness._redis_status() == {"status": "not_configured", "required": True}
    assert readiness._email_status() == {"status": "not_configured", "required": True}


def test_unexpected_errors_are_privacy_safe_and_security_headers_are_present(caplog):
    canary = "SENSITIVE_PAYLOAD_CANARY"
    test_app = FastAPI()
    test_app.add_middleware(PrivacySafeErrorMiddleware)
    test_app.add_middleware(SecurityHeadersMiddleware)

    @test_app.post("/explode")
    async def explode():
        raise RuntimeError(canary)

    caplog.set_level(logging.ERROR, logger="cornellpulse.errors")
    with TestClient(test_app, raise_server_exceptions=False) as client:
        response = client.post(f"/explode?private={canary}", json={"free_text": canary})

    assert response.status_code == 500
    assert response.json()["detail"] == "An unexpected server error occurred."
    assert canary not in caplog.text
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["cache-control"] == "no-store"


def test_production_rejects_placeholder_database_credentials(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql+asyncpg://cpulse_user:yourpassword@db/cornellpulse")
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "a-production-admin-secret-that-is-long-enough")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", "$2b$12$" + "x" * 53)
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://cornellpulse.example")
    with pytest.raises(RuntimeError, match="DATABASE_URL"):
        auth.validate_security_settings()


def test_production_requires_monitored_privacy_contact(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "DATABASE_URL", "postgresql+asyncpg://user:strong-local-value@db/cornellpulse")
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "a-production-admin-secret-that-is-long-enough")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", "$2b$12$" + "x" * 53)
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://cornellpulse.example")
    monkeypatch.setattr(settings, "AGGREGATE_SIGNING_SECRET", "a-separate-aggregate-key-that-is-long-enough")
    monkeypatch.setattr(settings, "PRIVACY_CONTACT_EMAIL", "")
    with pytest.raises(RuntimeError, match="PRIVACY_CONTACT_EMAIL"):
        auth.validate_security_settings()
