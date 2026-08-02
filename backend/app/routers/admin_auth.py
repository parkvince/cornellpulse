from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    clear_admin_cookie,
    create_admin_token,
    require_admin,
    set_admin_cookie,
    verify_admin_password,
)
from app.config import settings
from app.database import get_db
from app.services.rate_limits import enforce_persistent_rate_limit


router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


class AdminLoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=256)


@router.post("/login")
async def login(payload: AdminLoginRequest, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    client_ip = request.client.host if request.client else "unknown"
    await enforce_persistent_rate_limit(db, "admin-login", client_ip, settings.ADMIN_LOGIN_MAX_ATTEMPTS, settings.ADMIN_LOGIN_WINDOW_SECONDS)
    if not verify_admin_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    set_admin_cookie(response, create_admin_token())
    return {"authenticated": True}


@router.get("/session")
async def session(request: Request):
    require_admin(request)
    return {"authenticated": True}


@router.post("/logout")
async def logout(response: Response):
    clear_admin_cookie(response)
    return {"authenticated": False}
