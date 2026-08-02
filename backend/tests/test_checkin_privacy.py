from unittest.mock import AsyncMock, patch

import pytest

from app.models.schemas import CheckInRequest
from app.routers.checkin import submit_checkin


def make_request(contribute_aggregate: bool) -> CheckInRequest:
    return CheckInRequest(
        mood_score=5,
        sleep_category="6_to_8",
        workload_category="moderate",
        stress_triggers=["academics"],
        wants_to_talk=False,
        free_text="test input",
        college="engineering",
        session_token="test-session-token",
        contribute_aggregate=contribute_aggregate,
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("consented", [False, True])
async def test_aggregate_update_requires_explicit_consent(consented):
    redis = AsyncMock()
    redis.get.return_value = None

    with patch("app.routers.checkin.update_aggregates", new_callable=AsyncMock) as update_aggregates:
        response = await submit_checkin(make_request(consented), db=AsyncMock(), r=redis)

    assert response.aggregate_updated is consented
    assert update_aggregates.await_count == (1 if consented else 0)
    redis.setex.assert_awaited_once_with("dedup:session:test-session-token", 1800, "1")
