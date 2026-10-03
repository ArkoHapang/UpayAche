"""
UpayAche — API v1 Master Router.
Aggregates all API v1 endpoints for auth, transactions, risk, network, investigations, ai, and health.
"""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    health,
    auth,
    transactions,
    risk,
    network,
    investigations,
    ai,
    audit,
    analytics,
    chat
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router)
api_router.include_router(transactions.router)
api_router.include_router(risk.router)
api_router.include_router(network.router)
api_router.include_router(investigations.router)
api_router.include_router(ai.router)
api_router.include_router(audit.router)
api_router.include_router(analytics.router)
api_router.include_router(chat.router)

