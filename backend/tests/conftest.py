import pytest

from app.config import settings


@pytest.fixture(autouse=True)
def disable_local_peer_sandbox_by_default(monkeypatch):
    """Keep the checked-in test contract independent of a developer's local .env."""
    monkeypatch.setattr(settings, "PEER_SANDBOX_MODE", False)
