from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.schemas import AggregateContributionRequest, AggregateContributionResponse
from app.services.aggregation import update_aggregates
from app.database import get_db

router = APIRouter()

@router.post("/checkin/aggregate", response_model=AggregateContributionResponse)
async def contribute_checkin_aggregate(
    request: AggregateContributionRequest,
    db: AsyncSession = Depends(get_db),
):
    if not 1 <= request.mood_score <= 10:
        raise HTTPException(status_code=400, detail="mood_score must be between 1 and 10")

    await update_aggregates(request=request, db=db)
    return AggregateContributionResponse(aggregate_updated=True)
