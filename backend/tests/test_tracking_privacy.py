from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from app.routers.tracking import ClickRequest, track_click


@pytest.mark.asyncio
async def test_resource_click_rejects_missing_consent_before_database_write():
    db = AsyncMock()

    with pytest.raises(HTTPException) as exc_info:
        await track_click(ClickRequest(resource_id="988", action="call"), db=db)

    assert exc_info.value.status_code == 400
    db.add.assert_not_called()
    db.commit.assert_not_awaited()
