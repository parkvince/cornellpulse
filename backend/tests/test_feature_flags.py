import pytest
from fastapi import HTTPException

from app import auth
from app.config import settings
from app.routers.peer import require_peer_connect, require_supporter_signup


@pytest.mark.parametrize("guard", [require_peer_connect, require_supporter_signup])
def test_safety_review_features_are_disabled_by_default(guard):
    with pytest.raises(HTTPException) as exc_info:
        guard()

    assert exc_info.value.status_code == 503
    assert "safety review" in exc_info.value.detail.lower()


@pytest.mark.parametrize("guard, flag", [(require_peer_connect, "FEATURE_PEER_CONNECT"), (require_supporter_signup, "FEATURE_SUPPORTER_SIGNUP")])
def test_environment_flag_alone_cannot_bypass_external_readiness(monkeypatch, guard, flag):
    monkeypatch.setattr(settings, flag, True)
    monkeypatch.setattr(auth, "CORNELL_IDENTITY_INTEGRATION_IMPLEMENTED", False)

    with pytest.raises(HTTPException) as exc_info:
        guard()

    assert exc_info.value.status_code == 503
    assert "readiness gate" in exc_info.value.detail.lower()
