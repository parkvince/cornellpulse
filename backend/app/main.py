import logging

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth import validate_security_settings
from app.database import init_db
from app.middleware import PrivacySafeErrorMiddleware, SecurityHeadersMiddleware
from app.routers import admin_auth, checkin, heatmap, peer, tracking
from app.services.readiness import readiness_report

validate_security_settings()

app = FastAPI(
    title="CornellPulse API",
    description="Campus wellness resource navigator for Cornell students",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PrivacySafeErrorMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

@app.on_event("startup")
async def startup():
    try:
        await init_db()
    except Exception as exc:
        logging.getLogger("cornellpulse.startup").error("database_initialization_unavailable error_type=%s", type(exc).__name__)

app.include_router(checkin.router, prefix="/api/v1")
app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(heatmap.router, prefix="/api/v1")
app.include_router(peer.router, prefix="/api/v1")
app.include_router(tracking.router, prefix="/api/v1")

@app.get("/api/v1/health/live")
async def liveness_check():
    return {"status": "alive"}


@app.get("/api/v1/health/ready")
async def readiness_check(response: Response):
    report = await readiness_report()
    if report["status"] != "ready":
        response.status_code = 503
    return report


@app.get("/api/v1/health", include_in_schema=False)
async def legacy_health_check(response: Response):
    return await readiness_check(response)
