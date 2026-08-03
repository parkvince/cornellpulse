import logging
from uuid import uuid4

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import settings

logger = logging.getLogger("cornellpulse.errors")


class PrivacySafeErrorMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        error_id = str(uuid4())
        try:
            response = await call_next(request)
        except Exception as exc:
            # Never log query strings, headers, cookies, request bodies, or exception messages.
            logger.error(
                "unhandled_request_error error_id=%s method=%s path=%s error_type=%s",
                error_id,
                request.method,
                request.url.path,
                type(exc).__name__,
            )
            response = JSONResponse(
                status_code=500,
                content={"detail": "An unexpected server error occurred.", "error_id": error_id},
            )
        response.headers["X-Request-Id"] = error_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
        response.headers["Cache-Control"] = "no-store"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
