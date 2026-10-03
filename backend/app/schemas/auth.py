"""
UpayAche — Authentication Schemas.
"""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", example="analyst@upayache.internal")
    password: str = Field(..., min_length=4, example="password123")


class UserResponse(BaseModel):
    id: str
    email: str
    role: str
    full_name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
