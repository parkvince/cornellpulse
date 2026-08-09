import asyncio
from typing import Any

from sqlalchemy import text

from app.auth import validate_security_settings
from app.config import settings
from app.database import engine
from app.services.retention import retention_runtime_status


async def _postgres_status() -> dict[str, Any]:
    try:
        async def probe() -> None:
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
        await asyncio.wait_for(probe(), timeout=2.0)
        return {"status": "ready", "required": True}
    except Exception:
        return {"status": "unavailable", "required": True}


async def _redis_status() -> dict[str, Any]:
    if not settings.REDIS_URL:
        return {"status": "not_configured", "required": settings.REDIS_REQUIRED}
    client = None
    try:
        from redis.asyncio import Redis
        client = Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2, socket_timeout=2)
        await asyncio.wait_for(client.ping(), timeout=2.5)
        return {"status": "ready", "required": settings.REDIS_REQUIRED}
    except Exception:
        return {"status": "unavailable", "required": settings.REDIS_REQUIRED}
    finally:
        if client is not None:
            await client.aclose()


def _email_status() -> dict[str, Any]:
    configured = bool(
        settings.RESEND_API_KEY
        and not settings.RESEND_API_KEY.startswith("replace-")
        and "@" in (settings.PEER_SAFETY_CONTACT_EMAIL or settings.ADMIN_EMAIL)
    )
    required = settings.FEATURE_PEER_CONNECT or settings.FEATURE_SUPPORTER_SIGNUP
    return {"status": "configured" if configured else "not_configured", "required": required}


def _configuration_status() -> dict[str, Any]:
    try:
        validate_security_settings()
        valid = all(value > 0 for value in (
            settings.AGGREGATE_MAX_CONTRIBUTIONS_PER_HOUR,
            settings.AGGREGATE_RECEIPT_RETENTION_DAYS,
            settings.AGGREGATE_RETENTION_DAYS,
            settings.RESOURCE_CLICK_RETENTION_DAYS,
            settings.TECHNICAL_LOG_RETENTION_DAYS,
            settings.PUSH_SUBSCRIBER_RETENTION_DAYS,
            settings.ACADEMIC_CALENDAR_RETENTION_DAYS,
            settings.RETENTION_SWEEP_INTERVAL_MINUTES,
        ))
    except RuntimeError:
        valid = False
    return {"status": "ready" if valid else "invalid", "required": True}


async def readiness_report() -> dict[str, Any]:
    postgres, redis = await asyncio.gather(_postgres_status(), _redis_status())
    components = {
        "postgresql": postgres,
        "redis": redis,
        "email": _email_status(),
        "configuration": _configuration_status(),
        "retention": retention_runtime_status(),
    }
    ready = all(
        component["status"] in {"ready", "configured"}
        for component in components.values()
        if component["required"]
    )
    return {"status": "ready" if ready else "not_ready", "components": components}
