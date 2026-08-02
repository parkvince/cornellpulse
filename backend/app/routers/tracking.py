from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.db_models import ResourceClick
from app.auth import require_admin

router = APIRouter()

class ClickRequest(BaseModel):
    resource_id: str
    action: str

@router.post("/track-click")
async def track_click(request: ClickRequest, db: AsyncSession = Depends(get_db)):
    click = ResourceClick(resource_id=request.resource_id, action=request.action)
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
