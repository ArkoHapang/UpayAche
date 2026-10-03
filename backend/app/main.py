"""
UpayAche — FastAPI Application Entrypoint.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.api.v1.router import api_router
from app.schemas.health import HealthResponse
from app.core.middleware import RequestIdMiddleware
from app.core.errors import (
    http_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("upayache")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing UpayAche Risk & Intelligence Engine...")
    yield
    logger.info("Shutting down UpayAche Risk & Intelligence Engine...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="UpayAche — AI-Powered MFS Risk & Scam Intelligence API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Custom Exception Handlers for structured error responses
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Custom Middlewares
app.add_middleware(RequestIdMiddleware)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Root health check endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def root_health() -> HealthResponse:
    """System health check at server root."""
    return HealthResponse(
        status="healthy",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT
    )


# Root landing endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "See the risk. Understand the reason. Investigate the network.",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# Include versioned API routers
app.include_router(api_router, prefix=settings.API_V1_STR)
