"""
UpayAche — Guarded AI Copilot REST API Endpoints.
"""

from fastapi import APIRouter, Depends
from app.schemas.ai import AIInvestigationRequest, AIInvestigationResponse
from app.services.ai_service import AICopilotService, get_ai_service
from app.core.security import CurrentUser, get_current_user, require_role

router = APIRouter(prefix="/ai", tags=["Guarded AI Investigation Copilot"])


@router.post(
    "/investigate",
    response_model=AIInvestigationResponse,
    summary="Generate AI Copilot Investigation Dossier",
    description="Synthesizes structured evidence into a grounded investigation report with fraud typology and actions."
)
async def investigate_case(
    req: AIInvestigationRequest,
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST"])),
    service: AICopilotService = Depends(get_ai_service)
) -> AIInvestigationResponse:
    return service.investigate(req, user=current_user)


@router.post(
    "/analyze",
    response_model=AIInvestigationResponse,
    summary="Alias for AI Copilot Investigation",
    include_in_schema=False
)
async def analyze_case(
    req: AIInvestigationRequest,
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST"])),
    service: AICopilotService = Depends(get_ai_service)
) -> AIInvestigationResponse:
    return service.investigate(req, user=current_user)
