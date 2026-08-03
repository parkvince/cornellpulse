from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from app.models.db_models import CollegeHourAggregate, CampusHourAggregate
from app.models.schemas import AggregateContributionRequest

SLEEP_SCORES = {
    "under_4": 1.0,
    "4_to_6": 0.6,
    "6_to_8": 0.2,
    "over_8": 0.0,
}

WORKLOAD_SCORES = {
    "light": 0.0,
    "moderate": 0.3,
    "heavy": 0.6,
    "unbearable": 1.0,
}

async def update_aggregates(request: AggregateContributionRequest, db: AsyncSession):
    now = datetime.now(timezone.utc)
    hour_bucket = now.replace(minute=0, second=0, microsecond=0)

    sleep_score = SLEEP_SCORES.get(request.sleep_category.value, 0.5)
    workload_score = WORKLOAD_SCORES.get(request.workload_category.value, 0.5)
    college = request.college.value

    result = await db.execute(
        select(CollegeHourAggregate).where(
            CollegeHourAggregate.college == college,
            CollegeHourAggregate.hour_bucket == hour_bucket
        )
    )
    row = result.scalar_one_or_none()

    if row is None:
        row = CollegeHourAggregate(
            college=college,
            hour_bucket=hour_bucket,
            check_in_count=1,
            mood_sum=request.mood_score,
            sleep_score_sum=sleep_score,
            workload_score_sum=workload_score,
        ).with_for_update()
        db.add(row)
    else:
        row.check_in_count += 1
        row.mood_sum += request.mood_score
        row.sleep_score_sum += sleep_score
        row.workload_score_sum += workload_score

    campus_result = await db.execute(
        select(CampusHourAggregate).where(
            CampusHourAggregate.hour_bucket == hour_bucket
        ).with_for_update()
    )
    campus_row = campus_result.scalar_one_or_none()

    if campus_row is None:
        campus_row = CampusHourAggregate(
            hour_bucket=hour_bucket,
            check_in_count=1,
            mood_sum=request.mood_score,
            sleep_score_sum=sleep_score,
            workload_score_sum=workload_score,
        )
        db.add(campus_row)
    else:
        campus_row.check_in_count += 1
        campus_row.mood_sum += request.mood_score
        campus_row.sleep_score_sum += sleep_score
        campus_row.workload_score_sum += workload_score
