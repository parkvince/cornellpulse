from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timezone
from app.models.db_models import CollegeHourAggregate, CampusHourAggregate
from app.models.schemas import CheckInRequest

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

async def update_aggregates(request: CheckInRequest, distress_level: str, resource_id: str, db: AsyncSession):
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
            distress_level_high=1 if distress_level == "high" else 0,
            distress_level_mod=1 if distress_level == "moderate" else 0,
            distress_level_low=1 if distress_level == "low" else 0,
            resource_routed={resource_id: 1},
        )
        db.add(row)
    else:
        row.check_in_count += 1
        row.mood_sum += request.mood_score
        row.sleep_score_sum += sleep_score
        row.workload_score_sum += workload_score
        if distress_level == "high":
            row.distress_level_high += 1
        elif distress_level == "moderate":
            row.distress_level_mod += 1
        else:
            row.distress_level_low += 1
        routed = dict(row.resource_routed or {})
        routed[resource_id] = routed.get(resource_id, 0) + 1
        row.resource_routed = routed

    campus_result = await db.execute(
        select(CampusHourAggregate).where(
            CampusHourAggregate.hour_bucket == hour_bucket
        )
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

    await db.commit()