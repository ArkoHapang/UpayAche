"""
UpayAche — Investigation Lifecycle & State Machine Service.
Enforces the strict state machine:
[OPEN] -> [INVESTIGATING] -> [REVIEWED] -> [CLOSED]
"""

from typing import Optional, List
from fastapi import HTTPException
from app.db.repository import DataRepository, get_repository
from app.schemas.investigations import (
    InvestigationCaseCreate,
    InvestigationCaseUpdate,
    InvestigationCaseResponse,
    InvestigationNoteCreate,
    InvestigationNoteResponse,
    InvestigationListResponse
)
from app.core.security import CurrentUser
from app.services.audit_service import get_audit_service


class InvestigationService:
    def __init__(self, repository: Optional[DataRepository] = None):
        self.repo = repository or get_repository()

    def list_cases(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> InvestigationListResponse:
        cases_raw, total = self.repo.list_cases(
            status=status,
            priority=priority,
            limit=limit,
            offset=offset
        )

        items = [
            InvestigationCaseResponse(
                id=c["id"],
                case_number=c["case_number"],
                title=c["title"],
                description=c["description"],
                status=c["status"],
                priority=c["priority"],
                resolution=c["resolution"],
                assigned_to=c.get("assigned_to"),
                target_wallet_id=c.get("target_wallet_id"),
                primary_transaction_id=c.get("primary_transaction_id"),
                created_at=c["created_at"],
                updated_at=c["updated_at"],
                closed_at=c.get("closed_at"),
                notes=[]
            )
            for c in cases_raw
        ]

        return InvestigationListResponse(items=items, total=total)

    def get_case(self, case_id: str) -> InvestigationCaseResponse:
        c = self.repo.get_case(case_id)
        if not c:
            raise HTTPException(status_code=404, detail=f"Investigation case '{case_id}' not found.")

        notes = [
            InvestigationNoteResponse(
                id=n["id"],
                case_id=n["case_id"],
                author_id=n["author_id"],
                author_role=n["author_role"],
                content=n["content"],
                note_type=n["note_type"],
                created_at=n["created_at"]
            )
            for n in c.get("notes", [])
        ]

        return InvestigationCaseResponse(
            id=c["id"],
            case_number=c["case_number"],
            title=c["title"],
            description=c["description"],
            status=c["status"],
            priority=c["priority"],
            resolution=c["resolution"],
            assigned_to=c.get("assigned_to"),
            target_wallet_id=c.get("target_wallet_id"),
            primary_transaction_id=c.get("primary_transaction_id"),
            created_at=c["created_at"],
            updated_at=c["updated_at"],
            closed_at=c.get("closed_at"),
            notes=notes
        )

    def create_case(self, data: InvestigationCaseCreate, user: CurrentUser) -> InvestigationCaseResponse:
        if user.role == "VIEWER":
            raise HTTPException(status_code=403, detail="Viewer role is not authorized to create investigation cases.")
        if user.role == "CUSTOMER":
            raise HTTPException(status_code=403, detail="Customer role is not authorized to create investigation cases.")

        new_case = self.repo.create_case(
            title=data.title,
            description=data.description,
            target_wallet_id=data.target_wallet_id,
            priority=data.priority,
            primary_transaction_id=data.primary_transaction_id,
            creator_id=user.id
        )

        get_audit_service().log_event(
            actor_id=user.id,
            actor_role=user.role,
            action="CASE_CREATED",
            resource_type="investigation_case",
            resource_id=new_case["id"],
            metadata={"title": data.title, "priority": data.priority}
        )

        return self.get_case(new_case["id"])

    def update_case(self, case_id: str, update: InvestigationCaseUpdate, user: CurrentUser) -> InvestigationCaseResponse:
        if user.role == "VIEWER":
            raise HTTPException(status_code=403, detail="Viewer role is not authorized to modify cases.")
        if user.role == "CUSTOMER":
            raise HTTPException(status_code=403, detail="Customer role is not authorized to modify cases.")

        curr_case = self.repo.get_case(case_id)
        if not curr_case:
            raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

        target_status = update.status or curr_case["status"]

        try:
            self.repo.update_case_status(
                case_id=case_id,
                new_status=target_status,
                resolution=update.resolution,
                assigned_to=update.assigned_to,
                analyst_comment=update.analyst_comment,
                user_role=user.role,
                user_id=user.id
            )
        except PermissionError as exc:
            raise HTTPException(status_code=403, detail=str(exc))
        except ValueError as exc:
            # 422 Unprocessable Entity for invalid state transitions or missing resolution
            raise HTTPException(status_code=422, detail=str(exc))
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc))

        action_type = "CASE_ASSIGNED" if (update.assigned_to and target_status == curr_case["status"]) else "CASE_STATUS_UPDATED"
        get_audit_service().log_event(
            actor_id=user.id,
            actor_role=user.role,
            action=action_type,
            resource_type="investigation_case",
            resource_id=case_id,
            metadata={
                "previous_status": curr_case["status"],
                "new_status": target_status,
                "resolution": update.resolution,
                "assigned_to": update.assigned_to,
                "comment": update.analyst_comment
            }
        )

        return self.get_case(case_id)

    def add_note(self, case_id: str, note_data: InvestigationNoteCreate, user: CurrentUser) -> InvestigationNoteResponse:
        if user.role == "VIEWER":
            raise HTTPException(status_code=403, detail="Viewer role is not authorized to append notes.")
        if user.role == "CUSTOMER":
            raise HTTPException(status_code=403, detail="Customer role is not authorized to append notes.")

        curr_case = self.repo.get_case(case_id)
        if not curr_case:
            raise HTTPException(status_code=404, detail=f"Case '{case_id}' not found.")

        note = self.repo.add_note(
            case_id=case_id,
            author_id=user.id,
            author_role=user.role,
            content=note_data.content,
            note_type=note_data.note_type
        )

        get_audit_service().log_event(
            actor_id=user.id,
            actor_role=user.role,
            action="NOTE_ADDED",
            resource_type="investigation_note",
            resource_id=note["id"],
            metadata={"case_id": case_id, "note_type": note_data.note_type}
        )

        return InvestigationNoteResponse(
            id=note["id"],
            case_id=note["case_id"],
            author_id=note["author_id"],
            author_role=note["author_role"],
            content=note["content"],
            note_type=note["note_type"],
            created_at=note["created_at"]
        )

    def reset_demo_data(self) -> dict:
        """Reset repository to pristine synthetic state."""
        self.repo.reset_demo_state()
        return {
            "status": "success",
            "message": "Demo data successfully reset to pristine synthetic state."
        }


_investigation_service: Optional[InvestigationService] = None

def get_investigation_service() -> InvestigationService:
    global _investigation_service
    if _investigation_service is None:
        _investigation_service = InvestigationService()
    return _investigation_service
