from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.db_models import CollegeHourAggregate, CampusHourAggregate
from datetime import datetime, timezone, timedelta

router = APIRouter()

MIN_COUNT = 10

@router.get("/heatmap/24h")
async def heatmap_24h(db: AsyncSession = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(
        select(
            CollegeHourAggregate.college,
            func.sum(CollegeHourAggregate.check_in_count).label("total_count"),
            func.sum(CollegeHourAggregate.mood_sum).label("total_mood"),
        ).where(
            CollegeHourAggregate.hour_bucket >= since
        ).group_by(CollegeHourAggregate.college)
    )
    rows = result.all()
    data = {}
    for row in rows:
        if row.total_count >= MIN_COUNT:
            data[row.college] = {
                "avg_mood": round(row.total_mood / row.total_count, 1),
                "count": row.total_count,
            }
        else:
            data[row.college] = {"avg_mood": None, "count": row.total_count}
    return data

@router.get("/campus/summary")
async def campus_summary(db: AsyncSession = Depends(get_db)):
    since = datetime.now(timezone.utc) - timedelta(hours=24)
    result = await db.execute(
        select(
            func.sum(CampusHourAggregate.check_in_count).label("total_count"),
            func.sum(CampusHourAggregate.mood_sum).label("total_mood"),
        ).where(CampusHourAggregate.hour_bucket >= since)
    )
    row = result.one()
    if not row.total_count:
        return {"avg_mood": None, "count": 0}
    return {
        "avg_mood": round(row.total_mood / row.total_count, 1),
        "count": row.total_count,
    }