from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import CheckInRequest, CheckInResponse
from app.services.triage_engine import run_triage
from app.services.aggregation import update_aggregates
from app.database import get_db
import redis.asyncio as aioredis
from app.config import settings

router = APIRouter()

async def get_redis():
    r = aioredis.from_url(settings.REDIS_URL)
    try:
        yield r
    finally:
        await r.close()

@router.post("/checkin", response_model=CheckInResponse)
async def submit_checkin(
    request: CheckInRequest,
    db: AsyncSession = Depends(get_db),
    r = Depends(get_redis)
):
    if not 1 <= request.mood_score <= 10:
        raise HTTPException(status_code=400, detail="mood_score must be between 1 and 10")

    dedup_key = f"dedup:session:{request.session_token}"
    already_submitted = await r.get(dedup_key)
    if already_submitted:
        raise HTTPException(status_code=400, detail="Duplicate submission")

    triage_result = run_triage(request)

    await update_aggregates(
        request=request,
        distress_level=triage_result.distress_level,
        resource_id=triage_result.primary.resource_id,
        db=db
    )

    await r.setex(dedup_key, 1800, "1")

    return CheckInResponse(
        triage_result=triage_result,
        aggregate_updated=True
    )