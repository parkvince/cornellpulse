import pytest
from fastapi import HTTPException

from app.routers.peer import require_peer_connect, require_supporter_signup


@pytest.mark.parametrize("guard", [require_peer_connect, require_supporter_signup])
def test_safety_review_features_are_disabled_by_default(guard):
    with pytest.raises(HTTPException) as exc_info:
        guard()

    assert exc_info.value.status_code == 503
    assert "safety review" in exc_info.value.detail.lower()
