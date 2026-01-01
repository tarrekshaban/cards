"""Pydantic models for request/response validation."""

from pydantic import BaseModel, EmailStr


# Auth Request Models
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


# Auth Response Models
class UserInfo(BaseModel):
    """User info returned in auth responses."""
    id: str
    email: str
    created_at: str
    email_confirmed: bool = True


class AuthResponse(BaseModel):
    """Response for login/signup/refresh endpoints."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserInfo


class UserResponse(BaseModel):
    """Response for /me endpoint."""
    id: str
    email: str
    created_at: str
    updated_at: str | None = None
    user_metadata: dict = {}


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str
