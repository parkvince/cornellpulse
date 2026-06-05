from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db

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

@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "online",
        "message": "CornellPulse API is running"
    }