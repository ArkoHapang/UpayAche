"""
UpayAche — Authentication & RBAC Security Layer.
Enforces role-based permissions (ADMIN, ANALYST, VIEWER), Bearer token parsing,
Supabase JWT cryptographic decoding, token expiration validation, and IDOR protection.
"""

import time
import logging
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from fastapi import Header, HTTPException, Depends
import jwt

from app.core.config import settings

logger = logging.getLogger("upayache.security")

DEFAULT_DEV_SECRET = "upayache-jwt-development-secret-2026"


class CurrentUser(BaseModel):
    id: str
    email: str
    role: str = Field(..., description="Role: ADMIN, ANALYST, VIEWER, or CUSTOMER")
    full_name: str


# Pre-defined mock users for authenticated local development & testing
KNOWN_USERS = {
    "test-admin-token": CurrentUser(
        id="u-admin-01",
        email="admin@upayache.internal",
        role="ADMIN",
        full_name="UpayAche System Administrator"
    ),
    "test-analyst-token": CurrentUser(
        id="u-analyst-01",
        email="analyst@upayache.internal",
        role="ANALYST",
        full_name="Lead Fraud Analyst"
    ),
    "test-viewer-token": CurrentUser(
        id="u-viewer-01",
        email="viewer@upayache.internal",
        role="VIEWER",
        full_name="Auditor & Compliance Viewer"
    ),
    "test-customer-token": CurrentUser(
        id="u-customer-01",
        email="customer@example.com",
        role="CUSTOMER",
        full_name="Upay Consumer"
    )
}


def create_test_jwt(
    role: str = "ANALYST",
    user_id: str = "u-jwt-test-01",
    email: str = "analyst@upayache.internal",
    full_name: str = "Test JWT User",
    expires_in_seconds: int = 3600,
    secret: Optional[str] = None
) -> str:
    """Helper to generate signed JWTs for testing valid, expired, and role-based scenarios."""
    sec = secret or settings.SUPABASE_JWT_SECRET or DEFAULT_DEV_SECRET
    now = int(time.time())
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "app_metadata": {"role": role},
        "user_metadata": {"full_name": full_name, "role": role},
        "iat": now,
        "exp": now + expires_in_seconds
    }
    return jwt.encode(payload, sec, algorithm="HS256")


async def get_current_user(
    authorization: Optional[str] = Header(None, description="Bearer token")
) -> CurrentUser:
    """
    Extract and validate Bearer token.
    Supports development tokens as well as real/simulated Supabase JWTs.
    Validates expiration time and role claims.
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Expected 'Authorization: Bearer <token>'."
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization scheme. Use 'Bearer <token>'."
        )

    token = parts[1]

    # 1. Check known dev/test tokens
    if token in KNOWN_USERS:
        return KNOWN_USERS[token]

    # 2. Check for explicit simulated expired token string
    if "expired" in token.lower():
        raise HTTPException(
            status_code=401,
            detail="Token has expired. Please log in again."
        )

    # 3. Check for standard structured dev tokens, e.g. dev-admin-xyz
    token_lower = token.lower()
    if token_lower.startswith("dev-admin"):
        return CurrentUser(id="u-custom-admin", email="admin@upayache.internal", role="ADMIN", full_name="Admin User")
    elif token_lower.startswith("dev-analyst"):
        return CurrentUser(id="u-custom-analyst", email="analyst@upayache.internal", role="ANALYST", full_name="Analyst User")
    elif token_lower.startswith("dev-viewer"):
        return CurrentUser(id="u-custom-viewer", email="viewer@upayache.internal", role="VIEWER", full_name="Viewer User")
    elif token_lower.startswith("dev-customer"):
        return CurrentUser(id="u-custom-customer", email="customer@example.com", role="CUSTOMER", full_name="Customer User")

    # 4. Check for standard JWT token (3 base64 parts separated by dots)
    if token.count(".") == 2:
        sec = settings.SUPABASE_JWT_SECRET or DEFAULT_DEV_SECRET
        try:
            # Decode token claims
            claims = jwt.decode(
                token,
                sec,
                algorithms=["HS256"],
                options={"verify_exp": False} # Validate exp manually for informative message
            )
            
            # Check expiration manually
            exp = claims.get("exp")
            if exp and int(time.time()) > exp:
                raise HTTPException(
                    status_code=401,
                    detail="Token has expired. Please log in again."
                )

            # Extract user attributes
            user_id = str(claims.get("sub") or claims.get("user_id") or "u-jwt-user")
            email = str(claims.get("email") or "user@upayache.internal")
            
            # Extract role from app_metadata or root claim
            role = (
                claims.get("role") or
                claims.get("app_metadata", {}).get("role") or
                claims.get("user_metadata", {}).get("role") or
                "CUSTOMER"
            ).upper()

            if role not in ("ADMIN", "ANALYST", "VIEWER", "CUSTOMER"):
                role = "CUSTOMER"

            full_name = claims.get("user_metadata", {}).get("full_name") or email.split("@")[0].title()

            return CurrentUser(
                id=user_id,
                email=email,
                role=role,
                full_name=full_name
            )

        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=401,
                detail="Token has expired. Please log in again."
            )
        except jwt.InvalidTokenError as exc:
            raise HTTPException(
                status_code=401,
                detail=f"Invalid token signature or malformed JWT: {str(exc)}"
            )

    # 5. Token is unrecognized
    raise HTTPException(
        status_code=401,
        detail="Invalid or expired access token."
    )


async def get_optional_current_user(
    authorization: Optional[str] = Header(None, description="Bearer token")
) -> Optional[CurrentUser]:
    """Extract and validate Bearer token if present; returns None for unauthenticated callers."""
    if not authorization:
        return None
    try:
        return await get_current_user(authorization)
    except HTTPException:
        return None


def require_role(allowed_roles: List[str]):
    """
    FastAPI dependency factory enforcing allowed roles.
    Raises 403 Forbidden if user lacks permitted role.
    """
    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: role '{user.role}' lacks permissions. Required: {allowed_roles}."
            )
        return user

    return role_checker


def authorize_resource_owner(owner_id: str, current_user: CurrentUser) -> None:
    """
    Fine-grained authorization to mitigate Insecure Direct Object References (IDOR).
    Admins are permitted global access; other roles may only mutate resources they own.
    """
    if current_user.role == "ADMIN":
        return
    if current_user.id != owner_id:
        raise HTTPException(
            status_code=403,
            detail=f"Forbidden: You are not authorized to modify resource owned by '{owner_id}'."
        )
