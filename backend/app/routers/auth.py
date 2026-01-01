from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from supabase import Client

from ..dependencies import get_supabase_client, get_current_user

router = APIRouter()


# Request/Response Models
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: str
    updated_at: str | None = None
    user_metadata: dict = {}


class MessageResponse(BaseModel):
    message: str


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignUpRequest,
    supabase: Annotated[Client, Depends(get_supabase_client)],
):
    """
    Create a new user account with email and password.
    
    Returns access and refresh tokens on successful signup.
    """
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })
        
        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user account",
            )
        
        if response.session is None:
            # Email confirmation required
            return AuthResponse(
                access_token="",
                refresh_token="",
                token_type="bearer",
                expires_in=0,
                user={
                    "id": response.user.id,
                    "email": response.user.email,
                    "created_at": str(response.user.created_at),
                    "email_confirmed": False,
                },
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            expires_in=response.session.expires_in,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "created_at": str(response.user.created_at),
            },
        )
        
    except Exception as e:
        if "already registered" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists",
            ) from e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.post("/login", response_model=AuthResponse)
async def login(
    request: LoginRequest,
    supabase: Annotated[Client, Depends(get_supabase_client)],
):
    """
    Sign in with email and password.
    
    Returns access and refresh tokens on successful login.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        
        if response.session is None or response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            expires_in=response.session.expires_in,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "created_at": str(response.user.created_at),
            },
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        ) from e


@router.post("/logout", response_model=MessageResponse)
async def logout(
    supabase: Annotated[Client, Depends(get_supabase_client)],
    _current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Sign out the current user session.
    
    Requires a valid access token in the Authorization header.
    """
    try:
        supabase.auth.sign_out()
        return MessageResponse(message="Successfully logged out")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout",
        ) from e


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    request: RefreshRequest,
    supabase: Annotated[Client, Depends(get_supabase_client)],
):
    """
    Refresh the access token using a refresh token.
    
    Returns new access and refresh tokens.
    """
    try:
        response = supabase.auth.refresh_session(request.refresh_token)
        
        if response.session is None or response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            expires_in=response.session.expires_in,
            user={
                "id": response.user.id,
                "email": response.user.email,
                "created_at": str(response.user.created_at),
            },
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to refresh token",
        ) from e


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Get the current authenticated user's information.
    
    Requires a valid access token in the Authorization header.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        created_at=str(current_user.created_at),
        updated_at=str(current_user.updated_at) if current_user.updated_at else None,
        user_metadata=current_user.user_metadata or {},
    )
