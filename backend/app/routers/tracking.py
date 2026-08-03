from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.db_models import ResourceClick
from app.auth import require_admin
from app.services.rate_limits import enforce_persistent_rate_limit

router = APIRouter()

class ClickRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    resource_id: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9_]+$")
    action: Literal["call", "website"]
    consent_granted: bool = False

@router.post("/track-click")
async def track_click(payload: ClickRequest, request: Request, db: AsyncSession = Depends(get_db)):
    if not payload.consent_granted:
        raise HTTPException(status_code=400, detail="Analytics consent is required")
    await enforce_persistent_rate_limit(
        db,
        scope="resource-click-analytics",
        subject=request.client.host if request.client else "unknown",
        limit=60,
        window_seconds=3600,
    )
    click = ResourceClick(resource_id=payload.resource_id, action=payload.action)
    db.add(click)
    await db.commit()
    return {"status": "recorded"}

@router.get("/click-stats", dependencies=[Depends(require_admin)])
async def click_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            ResourceClick.resource_id,
            ResourceClick.action,
            func.count(ResourceClick.id).label("count")
        ).group_by(ResourceClick.resource_id, ResourceClick.action)
        .order_by(func.count(ResourceClick.id).desc())
    )
    rows = result.all()
    return [{"resource_id": r.resource_id, "action": r.action, "count": r.count} for r in rows]
