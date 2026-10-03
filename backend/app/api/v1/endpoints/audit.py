"""
UpayAche — Audit Trail REST API Endpoints.
Restricted to ADMIN and ANALYST roles for regulatory compliance.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query

from app.schemas.audit import AuditLogListResponse
from app.services.audit_service import AuditService, get_audit_service
from app.core.security import CurrentUser, require_role

router = APIRouter(prefix="/audit", tags=["Compliance & Audit Trail"])


@router.get(
    "/logs",
    response_model=AuditLogListResponse,
    summary="List Forensic Audit Trail",
    description="Retrieve append-only audit entries recording case state transitions, mutations, and intelligence runs."
)
async def list_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    actor_id: Optional[str] = Query(default=None),
    action: Optional[str] = Query(default=None),
    resource_type: Optional[str] = Query(default=None),
    resource_id: Optional[str] = Query(default=None),
    current_user: CurrentUser = Depends(require_role(["ADMIN", "ANALYST"])),
    service: AuditService = Depends(get_audit_service)
) -> AuditLogListResponse:
    # IDOR Protection: Analysts may strictly query only their own audit trails
    effective_actor_id = current_user.id if current_user.role == "ANALYST" else actor_id

    return service.list_logs(
        limit=limit,
        offset=offset,
        actor_id=effective_actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id
    )
