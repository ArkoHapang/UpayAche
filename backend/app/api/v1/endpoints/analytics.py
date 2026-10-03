"""
UpayAche — Analytics & Models REST API Endpoints.
Exposes real-time system performance and authentic model evaluation benchmarks.
"""

from fastapi import APIRouter, Depends
from app.schemas.analytics import (
    SystemAnalyticsResponse,
    ModelsAnalyticsResponse
)
from app.services.analytics_service import AnalyticsService, get_analytics_service
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Model Intelligence"])


@router.get(
    "/system",
    response_model=SystemAnalyticsResponse,
    summary="Get System & Investigation Analytics",
    description="Returns live platform operational metrics: transactions analyzed, alerts, case counts, and avg investigation resolution time."
)
async def get_system_analytics(
    current_user: CurrentUser = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> SystemAnalyticsResponse:
    return service.get_system_analytics()


@router.get(
    "/models",
    response_model=ModelsAnalyticsResponse,
    summary="Get Machine Learning Models Evaluation & Performance",
    description="Returns precision, recall, F1, ROC-AUC, FPR, FNR, confusion matrices, and risk/anomaly distributions from actual model evaluations."
)
async def get_models_analytics(
    current_user: CurrentUser = Depends(get_current_user),
    service: AnalyticsService = Depends(get_analytics_service)
) -> ModelsAnalyticsResponse:
    return service.get_models_analytics()
