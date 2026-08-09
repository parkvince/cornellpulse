from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import new as hmac_new
from secrets import token_bytes
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.db_models import AggregateContributionReceipt
from app.models.schemas import AggregateContributionRequest, AggregateContributionResponse
from app.services.aggregation import update_aggregates
from app.services.rate_limits import enforce_persistent_rate_limit

router = APIRouter()
_DEVELOPMENT_AGGREGATE_KEY = token_bytes(32)


def _contribution_hash(contribution_id: UUID) -> str:
    configured_key = settings.AGGREGATE_SIGNING_SECRET.strip()
    key = configured_key.encode("utf-8") if configured_key else _DEVELOPMENT_AGGREGATE_KEY
    return hmac_new(key, str(contribution_id).encode("ascii"), sha256).hexdigest()


@router.post("/checkin/aggregate", response_model=AggregateContributionResponse)
async def contribute_checkin_aggregate(
    request: AggregateContributionRequest,
    http_request: Request,
    idempotency_key: UUID = Header(alias="X-Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
):
    """Record one coarse daily completion without receiving check-in answers or college."""
    now = datetime.now(timezone.utc)
    contribution_hash = _contribution_hash(idempotency_key)
    existing = await db.execute(
        select(AggregateContributionReceipt.receipt_id).where(
            AggregateContributionReceipt.contribution_hash == contribution_hash
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This aggregate contribution was already recorded.")

    client_host = http_request.client.host if http_request.client else "unknown"
    await enforce_persistent_rate_limit(
        db,
        scope="aggregate-contribution",
        subject=client_host,
        limit=settings.AGGREGATE_MAX_CONTRIBUTIONS_PER_HOUR,
        window_seconds=3600,
        now=now,
    )

    await db.execute(delete(AggregateContributionReceipt).where(AggregateContributionReceipt.expires_at <= now))
    db.add(AggregateContributionReceipt(
        contribution_hash=contribution_hash,
        expires_at=now + timedelta(days=settings.AGGREGATE_RECEIPT_RETENTION_DAYS),
    ))
    try:
        await db.flush()
        await update_aggregates(db=db, now=now)
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This aggregate contribution was already recorded.") from exc
    except Exception:
        await db.rollback()
        raise
    return AggregateContributionResponse(aggregate_updated=True)
