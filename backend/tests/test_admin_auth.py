import bcrypt
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app import auth
from app.config import settings
from app.database import get_db
from app.routers import admin_auth, peer, tracking


def build_admin_app() -> FastAPI:
    app = FastAPI()
    app.include_router(admin_auth.router, prefix="/api/v1")
    return app


def build_protected_routes_app() -> FastAPI:
    app = FastAPI()
    app.include_router(peer.router, prefix="/api/v1")
    app.include_router(tracking.router, prefix="/api/v1")

    async def database_must_not_be_reached():
        raise AssertionError("unauthenticated request reached the database dependency")
        yield

    app.dependency_overrides[get_db] = database_must_not_be_reached
    return app


@pytest.fixture(autouse=True)
def reset_login_attempts():
    auth._login_attempts.clear()
    yield
    auth._login_attempts.clear()


@pytest.mark.parametrize(
    ("method", "path"),
    [
        ("get", "/api/v1/peer-signups"),
        ("post", "/api/v1/peer-signups/1/approve"),
        ("delete", "/api/v1/peer-signups/1"),
        ("get", "/api/v1/peer-requests"),
        ("post", "/api/v1/peer-requests/1/resolve"),
        ("delete", "/api/v1/peer-requests/1"),
        ("get", "/api/v1/reports"),
        ("post", "/api/v1/reports/1/resolve"),
        ("delete", "/api/v1/reports/1"),
        ("get", "/api/v1/click-stats"),
    ],
)
def test_unauthenticated_users_cannot_access_admin_records(method, path):
    with TestClient(build_protected_routes_app()) as client:
        response = client.request(method, path, headers={"Origin": settings.FRONTEND_URL})

    assert response.status_code == 401
    assert response.json() == {"detail": "Administrator authentication required."}


def test_login_creates_http_only_session_and_logout_clears_it(monkeypatch):
    password = "correct horse battery staple"
    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", password_hash)
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "test-only-session-secret-that-is-at-least-32-characters")

    with TestClient(build_admin_app()) as client:
        login_response = client.post("/api/v1/admin/auth/login", json={"password": password})
        assert login_response.status_code == 200
        cookie = login_response.headers["set-cookie"]
        assert "HttpOnly" in cookie
        assert "SameSite=strict" in cookie
        assert "Path=/api/v1" in cookie

        assert client.get("/api/v1/admin/auth/session").status_code == 200

        logout_response = client.post("/api/v1/admin/auth/logout")
        assert logout_response.status_code == 200
        assert client.get("/api/v1/admin/auth/session").status_code == 401


def test_login_is_rate_limited(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_LOGIN_MAX_ATTEMPTS", 2)
    with TestClient(build_admin_app()) as client:
        assert client.post("/api/v1/admin/auth/login", json={"password": "wrong"}).status_code == 401
        assert client.post("/api/v1/admin/auth/login", json={"password": "wrong"}).status_code == 401
        response = client.post("/api/v1/admin/auth/login", json={"password": "wrong"})

    assert response.status_code == 429
    assert "Retry-After" in response.headers


def test_production_cookie_is_secure(monkeypatch):
    password = "correct horse battery staple"
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "FRONTEND_URL", "https://cornellpulse.example")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode())
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "test-only-session-secret-that-is-at-least-32-characters")

    with TestClient(build_admin_app(), base_url="https://api.cornellpulse.example") as client:
        response = client.post("/api/v1/admin/auth/login", json={"password": password})

    assert response.status_code == 200
    assert "Secure" in response.headers["set-cookie"]


def test_production_rejects_missing_admin_secrets(monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "ADMIN_SESSION_SECRET", "")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD_HASH", "")
    monkeypatch.setattr(settings, "FRONTEND_URL", "http://example.com")

    with pytest.raises(RuntimeError, match="Invalid production security configuration"):
        auth.validate_security_settings()
