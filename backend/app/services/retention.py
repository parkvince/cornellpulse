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


async def retention_loop() -> None:
    while True:
        try:
            await run_retention_sweep()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            logger.error("retention_sweep_failed error_type=%s", type(exc).__name__)
        await asyncio.sleep(settings.RETENTION_SWEEP_INTERVAL_MINUTES * 60)
