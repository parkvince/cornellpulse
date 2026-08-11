import pytest
from cryptography.fernet import Fernet
from fastapi import HTTPException

from app import auth
from app.config import settings
from app.routers.peer import require_peer_connect, require_supporter_signup


@pytest.mark.parametrize("guard", [require_peer_connect, require_supporter_signup])
def test_safety_review_features_are_disabled_by_default(monkeypatch, guard):
    monkeypatch.setattr(settings, "PEER_SANDBOX_MODE", False)
    monkeypatch.setattr(settings, "FEATURE_PEER_CONNECT", False)
    monkeypatch.setattr(settings, "FEATURE_SUPPORTER_SIGNUP", False)
    with pytest.raises(HTTPException) as exc_info:
        guard()

    assert exc_info.value.status_code == 503
    assert "safety review" in exc_info.value.detail.lower()


@pytest.mark.parametrize("guard, flag", [(require_peer_connect, "FEATURE_PEER_CONNECT"), (require_supporter_signup, "FEATURE_SUPPORTER_SIGNUP")])
def test_environment_flag_alone_cannot_bypass_external_readiness(monkeypatch, guard, flag):
    monkeypatch.setattr(settings, "PEER_SANDBOX_MODE", False)
    monkeypatch.setattr(settings, flag, True)
    monkeypatch.setattr(auth, "CORNELL_IDENTITY_INTEGRATION_IMPLEMENTED", False)

    with pytest.raises(HTTPException) as exc_info:
        guard()

    assert exc_info.value.status_code == 503
    assert "readiness gate" in exc_info.value.detail.lower()


@pytest.mark.parametrize("guard", [require_peer_connect, require_supporter_signup])
def test_local_sandbox_allows_peer_routes_only_with_local_security(monkeypatch, guard):
    monkeypatch.setattr(settings, "ENVIRONMENT", "dev")
    monkeypatch.setattr(settings, "PEER_SANDBOX_MODE", True)
    monkeypatch.setattr(settings, "PEER_AUTH_SECRET", "s" * 48)
    monkeypatch.setattr(settings, "PEER_PII_ENCRYPTION_KEY", Fernet.generate_key().decode("ascii"))

    guard()


@pytest.mark.parametrize("guard", [require_peer_connect, require_supporter_signup])
def test_open_sandbox_is_hard_blocked_in_production(monkeypatch, guard):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "PEER_SANDBOX_MODE", True)

    with pytest.raises(HTTPException) as exc_info:
        guard()

    assert exc_info.value.status_code == 503
    assert "prohibited in production" in exc_info.value.detail.lower()
