from fastapi import APIRouter, HTTPException, Request, Response, status
from pydantic import BaseModel, Field

from app.auth import (
    clear_admin_cookie,
    clear_login_attempts,
    create_admin_token,
    enforce_login_rate_limit,
    require_admin,
    set_admin_cookie,
    verify_admin_password,
)


router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


class AdminLoginRequest(BaseModel):
    password: str = Field(min_length=1, max_length=256)


@router.post("/login")
async def login(payload: AdminLoginRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    enforce_login_rate_limit(client_ip)
    if not verify_admin_password(payload.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")

    clear_login_attempts(client_ip)
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
