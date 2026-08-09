from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.db_models import CampusDailyAggregate
from datetime import datetime, timezone

router = APIRouter()

@router.get("/heatmap/24h")
async def heatmap_24h(db: AsyncSession = Depends(get_db)):
    # College/hour and wellness-answer heatmaps were retired because low-count
    # buckets can expose a single person's sensitive answers.
    return {"status": "retired", "reason": "privacy_redesign", "data": {}}

@router.get("/campus/summary")
async def campus_summary(db: AsyncSession = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(
            func.sum(CampusDailyAggregate.check_in_count).label("total_count"),
        ).where(CampusDailyAggregate.day_bucket == today)
    )
    row = result.one()
    if not row.total_count:
        return {"date": today.isoformat(), "count": 0}
    return {"date": today.isoformat(), "count": row.total_count}
