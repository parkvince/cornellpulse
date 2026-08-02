from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth import validate_security_settings
from app.database import init_db
from app.routers import admin_auth, checkin, heatmap, peer, tracking

validate_security_settings()

app = FastAPI(
    title="CornellPulse API",
    description="Anonymous campus wellness navigator for Cornell students",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()

app.include_router(checkin.router, prefix="/api/v1")
app.include_router(admin_auth.router, prefix="/api/v1")
app.include_router(heatmap.router, prefix="/api/v1")
app.include_router(peer.router, prefix="/api/v1")
app.include_router(tracking.router, prefix="/api/v1")

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "online",
        "message": "CornellPulse API is running"
    }
