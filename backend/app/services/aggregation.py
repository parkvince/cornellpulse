from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.db_models import CampusDailyAggregate

async def update_aggregates(db: AsyncSession, now: datetime | None = None) -> None:
    """Increment only a campus-wide UTC-day completion counter atomically."""
    day_bucket = (now or datetime.now(timezone.utc)).date()
    statement = insert(CampusDailyAggregate).values(day_bucket=day_bucket, check_in_count=1)
    statement = statement.on_conflict_do_update(
        index_elements=[CampusDailyAggregate.day_bucket],
        set_={
            "check_in_count": CampusDailyAggregate.check_in_count + 1,
            "updated_at": datetime.now(timezone.utc),
        },
    )
    await db.execute(statement)
