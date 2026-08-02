from unittest.mock import AsyncMock, patch

import pytest
from pydantic import ValidationError

from app.models.schemas import AggregateContributionRequest
from app.models.db_models import CampusHourAggregate, CollegeHourAggregate
from app.routers.checkin import contribute_checkin_aggregate


def make_request() -> AggregateContributionRequest:
    return AggregateContributionRequest(
        mood_score=5,
        sleep_category="6_to_8",
        workload_category="moderate",
        college="engineering",
    )


@pytest.mark.asyncio
async def test_aggregate_endpoint_writes_only_the_validated_minimum_fields():
    request = make_request()
    db = AsyncMock()
    with patch("app.routers.checkin.update_aggregates", new_callable=AsyncMock) as update_aggregates:
        response = await contribute_checkin_aggregate(request, db=db)

    assert response.aggregate_updated is True
    update_aggregates.assert_awaited_once_with(request=request, db=db)


def test_aggregate_request_schema_has_no_sensitive_or_tracking_fields():
    assert set(AggregateContributionRequest.model_fields) == {
        "mood_score",
        "sleep_category",
        "workload_category",
        "college",
    }


def test_aggregate_database_tables_have_no_free_text_column():
    for model in (CollegeHourAggregate, CampusHourAggregate):
        columns = {column.name for column in model.__table__.columns}
        assert "free_text" not in columns
        assert "session_token" not in columns


@pytest.mark.parametrize(
    "extra_field",
    ["free_text", "stress_triggers", "wants_to_talk", "session_token", "recommendation"],
)
def test_aggregate_request_rejects_free_text_and_nonaggregate_fields(extra_field):
    payload = {
        "mood_score": 5,
        "sleep_category": "6_to_8",
        "workload_category": "moderate",
        "college": "engineering",
        extra_field: "SENSITIVE_CANARY",
    }

    with pytest.raises(ValidationError):
        AggregateContributionRequest(**payload)
