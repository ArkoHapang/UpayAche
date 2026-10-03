"""
UpayAche — Investigation Cases REST API Endpoints.
Enforces the investigation state machine:
[OPEN] -> [INVESTIGATING] -> [REVIEWED] -> [CLOSED]
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Path

from app.schemas.investigations import (
    InvestigationCaseCreate,
    InvestigationCaseUpdate,
    InvestigationCaseResponse,
    InvestigationNoteCreate,
    InvestigationNoteResponse,
    InvestigationListResponse
)
from app.services.investigation_service import (
    InvestigationService,
    get_investigation_service
)
from app.core.security import CurrentUser, get_current_user, require_role

router = APIRouter(prefix="/investigations", tags=["Investigation Cases"])


@router.get(
    "",
    response_model=InvestigationListResponse,
    summary="List Investigation Cases",
    description="Retrieve paginated list of cases filtered by status and priority."
)
async def list_cases(
    status: Optional[str] = Query(default=None, description="OPEN, INVESTIGATING, REVIEWED, CLOSED"),
    priority: Optional[str] = Query(default=None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationListResponse:
    return service.list_cases(
        status=status,
        priority=priority,
        limit=limit,
        offset=offset
    )


@router.post(
    "",
    response_model=InvestigationCaseResponse,
    status_code=201,
    summary="Create Investigation Case",
    description="Opens a new investigation case. Allowed for ANALYST and ADMIN roles."
)
async def create_case(
    data: InvestigationCaseCreate,
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationCaseResponse:
    return service.create_case(data=data, user=current_user)


@router.post(
    "/reset-demo",
    summary="Reset Demo State",
    description="Resets all investigation cases, notes, and in-memory caches to pristine synthetic state."
)
async def reset_demo(
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST"])),
    service: InvestigationService = Depends(get_investigation_service)
):
    return service.reset_demo_data()


@router.get(
    "/{id}",
    response_model=InvestigationCaseResponse,
    summary="Get Investigation Case Details",
    description="Fetches single case details along with timeline notes."
)
async def get_case(
    id: str = Path(..., description="Investigation case UUID"),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationCaseResponse:
    return service.get_case(case_id=id)


@router.patch(
    "/{id}",
    response_model=InvestigationCaseResponse,
    summary="Update Case Status & State Transition",
    description="Advances case through state machine: OPEN -> INVESTIGATING -> REVIEWED -> CLOSED. Reopening CLOSED case requires ADMIN."
)
async def update_case(
    id: str = Path(..., description="Investigation case UUID"),
    data: InvestigationCaseUpdate = ...,
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationCaseResponse:
    return service.update_case(case_id=id, update=data, user=current_user)


@router.post(
    "/{id}/notes",
    response_model=InvestigationNoteResponse,
    status_code=201,
    summary="Append Analyst Note",
    description="Appends an audit-logged note to the investigation timeline."
)
async def add_note(
    id: str = Path(..., description="Investigation case UUID"),
    data: InvestigationNoteCreate = ...,
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST", "VIEWER"])),
    service: InvestigationService = Depends(get_investigation_service)
) -> InvestigationNoteResponse:
    return service.add_note(case_id=id, note_data=data, user=current_user)
