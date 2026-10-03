"""
UpayAche — Structured Errors and Exception Handlers.
Standardizes HTTP error responses with timestamp, request ID, error code, and message.
"""

from typing import Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error explanation")
    details: Optional[List[Any]] = Field(default=None, description="Detailed validation or contextual errors")


class ErrorMetadata(BaseModel):
    timestamp: str
    request_id: str


class StandardErrorEnvelope(BaseModel):
    success: bool = False
    error: ErrorDetail
    metadata: ErrorMetadata


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "req-unknown")
    code = "HTTP_ERROR"
    if exc.status_code == 400:
        code = "BAD_REQUEST"
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 422:
        code = "UNPROCESSABLE_ENTITY"
    elif exc.status_code == 500:
        code = "INTERNAL_SERVER_ERROR"

    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)

    payload = {
        "success": False,
        "detail": message,
        "error": {
            "code": code,
            "message": message,
            "details": exc.detail if not isinstance(exc.detail, str) else []
        },
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id
        }
    }
    return JSONResponse(status_code=exc.status_code, content=payload)


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "req-unknown")
    errors = []
    for err in exc.errors():
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        errors.append({
            "location": loc,
            "msg": err.get("msg"),
            "type": err.get("type")
        })

    payload = {
        "success": False,
        "error": {
            "code": "VALIDATION_ERROR",
            "message": "Input validation failed. Please check payload parameters.",
            "details": errors
        },
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id
        }
    }
    return JSONResponse(status_code=422, content=payload)


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "req-unknown")
    payload = {
        "success": False,
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred while processing the request.",
            "details": [str(exc)]
        },
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "request_id": request_id
        }
    }
    return JSONResponse(status_code=500, content=payload)
