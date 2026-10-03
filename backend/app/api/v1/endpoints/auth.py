"""
UpayAche — Authentication REST API Endpoints.
"""

from fastapi import APIRouter, Depends, Path
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse
from app.services.auth_service import AuthService, get_auth_service
from app.core.security import CurrentUser, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate User & Issue Token",
    description="Logs in user and returns a Bearer access token with assigned RBAC role (ADMIN, ANALYST, VIEWER)."
)
async def login(
    req: LoginRequest,
    service: AuthService = Depends(get_auth_service)
) -> LoginResponse:
    return service.login(req)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get Current User Profile & Role",
    description="Validates Bearer token and returns active user details."
)
async def get_me(
    current_user: CurrentUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    return service.get_me(current_user)


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Get User Profile by ID (IDOR Protected)",
    description="Fetches user details with IDOR validation: Only the owner or an ADMIN may access the record."
)
async def get_user_by_id(
    user_id: str = Path(..., description="Target User UUID or Identifier"),
    current_user: CurrentUser = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    return service.get_user_by_id(target_user_id=user_id, current_user=current_user)

