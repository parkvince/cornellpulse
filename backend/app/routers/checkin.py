from fastapi import APIRouter, HTTPException
from app.models.schemas import CheckInRequest, CheckInResponse
from app.services.triage_engine import run_triage

router = APIRouter()

@router.post("/checkin", response_model=CheckInResponse)
async def submit_checkin(request: CheckInRequest):
    if not 1 <= request.mood_score <= 10:
        raise HTTPException(status_code=400, detail="mood_score must be between 1 and 10")

    triage_result = run_triage(request)

    return CheckInResponse(
        triage_result=triage_result,
        aggregate_updated=True
    )