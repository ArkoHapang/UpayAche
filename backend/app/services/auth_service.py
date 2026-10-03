"""
UpayAche — Authentication Service.
"""

from typing import Optional, Dict
from fastapi import HTTPException
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.core.security import CurrentUser, KNOWN_USERS, create_test_jwt, authorize_resource_owner
from app.services.audit_service import get_audit_service


class AuthService:
    def __init__(self):
        # In-memory user store initialized with default demo profiles
        self._users: Dict[str, CurrentUser] = {
            "u-admin-01": KNOWN_USERS["test-admin-token"],
            "u-analyst-01": KNOWN_USERS["test-analyst-token"],
            "u-viewer-01": KNOWN_USERS["test-viewer-token"],
        }

    def login(self, req: LoginRequest) -> LoginResponse:
        email_clean = req.email.lower().strip()
        
        if email_clean.startswith("admin"):
            user = self._users["u-admin-01"]
        elif email_clean.startswith("viewer"):
            user = self._users["u-viewer-01"]
        elif email_clean.startswith("analyst"):
            user = self._users["u-analyst-01"]
        else:
            uid = f"u-{email_clean.split('@')[0]}"
            if uid not in self._users:
                self._users[uid] = CurrentUser(
                    id=uid,
                    email=email_clean,
                    role="ANALYST",
                    full_name=email_clean.split('@')[0].title()
                )
            user = self._users[uid]

        token = create_test_jwt(
            role=user.role,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name
        )

        get_audit_service().log_event(
            actor_id=user.id,
            actor_role=user.role,
            action="USER_LOGIN_SUCCESS",
            resource_type="auth_session",
            resource_id=user.id,
            metadata={"email": user.email}
        )

        return LoginResponse(
            access_token=token,
            token_type="bearer",
            user=UserResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                full_name=user.full_name
            )
        )

    def get_me(self, current_user: CurrentUser) -> UserResponse:
        return UserResponse(
            id=current_user.id,
            email=current_user.email,
            role=current_user.role,
            full_name=current_user.full_name
        )

    def get_user_by_id(self, target_user_id: str, current_user: CurrentUser) -> UserResponse:
        """
        Retrieves user record.
        Enforces IDOR authorization: Only the owner or an ADMIN may access target user details.
        """
        authorize_resource_owner(owner_id=target_user_id, current_user=current_user)

        user = self._users.get(target_user_id)
        if not user:
            # Fallback if accessed via current_user
            if target_user_id == current_user.id:
                user = current_user
            else:
                raise HTTPException(status_code=404, detail=f"User with ID '{target_user_id}' not found.")

        return UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            full_name=user.full_name
        )


_auth_service: Optional[AuthService] = None

def get_auth_service() -> AuthService:
    global _auth_service
    if _auth_service is None:
        _auth_service = AuthService()
    return _auth_service

