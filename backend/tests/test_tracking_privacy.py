from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException, Request
from pydantic import ValidationError

from app.routers.tracking import ClickRequest, track_click


@pytest.mark.asyncio
async def test_resource_click_rejects_missing_consent_before_database_write():
    db = AsyncMock()
    request = Request({"type": "http", "client": ("127.0.0.1", 12345), "headers": []})

    with pytest.raises(HTTPException) as exc_info:
        await track_click(ClickRequest(resource_id="988", action="call"), request=request, db=db)

    assert exc_info.value.status_code == 400
    db.add.assert_not_called()
    db.commit.assert_not_awaited()


def test_analytics_event_rejects_free_text_and_unexpected_fields():
    assert set(ClickRequest.model_fields) == {"resource_id", "action", "consent_granted"}

    with pytest.raises(ValidationError):
        ClickRequest(
            resource_id="988",
            action="call",
            consent_granted=True,
            free_text="SENSITIVE_CANARY",
        )
