import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import AsyncSessionLocal
from app.models.db_models import (
    AcademicCalendarEvent,
    AggregateContributionReceipt,
    CampusDailyAggregate,
    PushSubscriber,
    RateLimitBucket,
    ResourceClick,
)

logger = logging.getLogger("cornellpulse.retention")
_loop_started_at: datetime | None = None
_last_success_at: datetime | None = None
_last_failure_at: datetime | None = None
_last_error_type: str | None = None


def retention_runtime_status(now: datetime | None = None) -> dict[str, object]:
    """Return a privacy-safe scheduler heartbeat for readiness checks."""
    current = now or datetime.now(timezone.utc)
    if _loop_started_at is None:
        return {"status": "not_running", "required": True, "last_success_at": None}
    if _last_failure_at is not None and (_last_success_at is None or _last_failure_at > _last_success_at):
        return {
            "status": "failed",
            "required": True,
            "last_success_at": _last_success_at.isoformat() if _last_success_at else None,
            "error_type": _last_error_type,
        }
    if _last_success_at is None:
        return {"status": "starting", "required": True, "last_success_at": None}
    stale_after = timedelta(minutes=settings.RETENTION_SWEEP_INTERVAL_MINUTES * 2)
    return {
        "status": "ready" if current - _last_success_at <= stale_after else "stale",
        "required": True,
        "last_success_at": _last_success_at.isoformat(),
    }


async def purge_expired_operational_data(db: AsyncSession, now: datetime | None = None) -> dict[str, int]:
    current = now or datetime.now(timezone.utc)
    statements = {
        "aggregates": delete(CampusDailyAggregate).where(
            CampusDailyAggregate.day_bucket < (current - timedelta(days=settings.AGGREGATE_RETENTION_DAYS)).date()
        ),
        "aggregate_receipts": delete(AggregateContributionReceipt).where(AggregateContributionReceipt.expires_at <= current),
        "resource_clicks": delete(ResourceClick).where(
            ResourceClick.clicked_at < current - timedelta(days=settings.RESOURCE_CLICK_RETENTION_DAYS)
        ),
        "push_subscribers": delete(PushSubscriber).where(
            PushSubscriber.subscribed_at < current - timedelta(days=settings.PUSH_SUBSCRIBER_RETENTION_DAYS)
        ),
        "academic_calendar_events": delete(AcademicCalendarEvent).where(
            AcademicCalendarEvent.fetched_at < current - timedelta(days=settings.ACADEMIC_CALENDAR_RETENTION_DAYS)
        ),
        "rate_limit_buckets": delete(RateLimitBucket).where(RateLimitBucket.expires_at <= current),
    }
    deleted: dict[str, int] = {}
    for label, statement in statements.items():
        result = await db.execute(statement)
        deleted[label] = int(result.rowcount or 0)
    await db.commit()
    return deleted


async def run_retention_sweep() -> None:
    global _last_success_at
    async with AsyncSessionLocal() as db:
        operational = await purge_expired_operational_data(db)

    # Peer records have field-level erasure rules, so reuse the protected purge
    # implementation rather than issuing unsafe blanket deletes.
    if settings.PEER_PII_ENCRYPTION_KEY:
        from app.auth import PeerPrincipal
        from app.routers.peer import purge_expired_peer_data

        async with AsyncSessionLocal() as db:
            await purge_expired_peer_data(PeerPrincipal("retention-scheduler", "administrator"), None, db)
    logger.info("retention_sweep_complete counts=%s", operational)
    _last_success_at = datetime.now(timezone.utc)


async def retention_loop() -> None:
    global _last_error_type, _last_failure_at, _loop_started_at
    _loop_started_at = datetime.now(timezone.utc)
    while True:
        try:
            await run_retention_sweep()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            _last_failure_at = datetime.now(timezone.utc)
            _last_error_type = type(exc).__name__
            logger.error("retention_sweep_failed error_type=%s", type(exc).__name__)
        await asyncio.sleep(settings.RETENTION_SWEEP_INTERVAL_MINUTES * 60)
