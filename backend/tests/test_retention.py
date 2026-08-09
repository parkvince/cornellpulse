from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.config import settings
from app.services.retention import purge_expired_operational_data


@pytest.mark.asyncio
async def test_operational_retention_deletes_every_expiring_record_class(monkeypatch):
    monkeypatch.setattr(settings, "AGGREGATE_RETENTION_DAYS", 30)
    monkeypatch.setattr(settings, "RESOURCE_CLICK_RETENTION_DAYS", 30)
    monkeypatch.setattr(settings, "PUSH_SUBSCRIBER_RETENTION_DAYS", 90)
    monkeypatch.setattr(settings, "ACADEMIC_CALENDAR_RETENTION_DAYS", 365)
    db = AsyncMock()
    result = MagicMock()
    result.rowcount = 2
    db.execute.return_value = result

    deleted = await purge_expired_operational_data(db, datetime(2026, 8, 8, tzinfo=timezone.utc))

    assert deleted == {
        "aggregates": 2,
        "aggregate_receipts": 2,
        "resource_clicks": 2,
        "push_subscribers": 2,
        "academic_calendar_events": 2,
        "rate_limit_buckets": 2,
    }
    assert db.execute.await_count == 6
    db.commit.assert_awaited_once()


def test_retention_periods_are_bounded_and_documented_defaults():
    assert settings.AGGREGATE_RETENTION_DAYS == 30
    assert settings.AGGREGATE_RECEIPT_RETENTION_DAYS == 2
    assert settings.RESOURCE_CLICK_RETENTION_DAYS == 30
    assert settings.TECHNICAL_LOG_RETENTION_DAYS == 14
    assert settings.PUSH_SUBSCRIBER_RETENTION_DAYS == 90
    assert settings.ACADEMIC_CALENDAR_RETENTION_DAYS == 365
    assert settings.RETENTION_SWEEP_INTERVAL_MINUTES == 60
