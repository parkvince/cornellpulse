from datetime import datetime, timedelta, timezone
from hashlib import sha256
from hmac import new as hmac_new

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.db_models import RateLimitBucket


def _subject_hash(scope: str, subject: str) -> str:
    key = (settings.PEER_AUTH_SECRET or settings.ADMIN_SESSION_SECRET or "development-rate-limit-key").encode("utf-8")
    return hmac_new(key, f"{scope}:{subject}".encode("utf-8"), sha256).hexdigest()


async def enforce_persistent_rate_limit(
    db: AsyncSession,
    scope: str,
    subject: str,
    limit: int,
    window_seconds: int,
    now: datetime | None = None,
) -> None:
    """Database-backed fixed-window limit with row locking across app processes."""
    if limit < 1 or window_seconds < 1:
        raise RuntimeError("Rate-limit configuration must be positive.")
    current_time = now or datetime.now(timezone.utc)
    subject_hash = _subject_hash(scope, subject)
    result = await db.execute(
        select(RateLimitBucket)
        .where(RateLimitBucket.scope == scope, RateLimitBucket.subject_hash == subject_hash)
        .with_for_update()
    )
    bucket = result.scalar_one_or_none()
    if bucket is None:
        bucket = RateLimitBucket(
            scope=scope,
            subject_hash=subject_hash,
            window_started_at=current_time,
            expires_at=current_time + timedelta(seconds=window_seconds),
            count=1,
        )
        db.add(bucket)
        try:
            await db.commit()
            return
        except IntegrityError:
            await db.rollback()
            # Another process created the unique bucket first; retry against its locked row.
            return await enforce_persistent_rate_limit(db, scope, subject, limit, window_seconds, current_time)

    expires_at = bucket.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= current_time:
        bucket.window_started_at = current_time
        bucket.expires_at = current_time + timedelta(seconds=window_seconds)
        bucket.count = 1
        await db.commit()
        return
    if bucket.count >= limit:
        retry_after = max(1, int((expires_at - current_time).total_seconds()))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    bucket.count += 1
    await db.commit()
