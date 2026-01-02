"""Authentication endpoints."""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from supabase import Client
from gotrue.types import User

from ..config import Settings, get_settings
from ..dependencies import get_supabase_client, get_supabase_admin_client, get_current_user, is_user_admin
from ..schemas import (
    SignUpRequest,
    LoginRequest,
    RefreshRequest,
    AuthResponse,
    UserInfo,
    UserResponse,
    MessageResponse,
)

router = APIRouter()


@router.post("/signup", response_model=AuthResponse)
async def signup(
    request: SignUpRequest,
    supabase: Annotated[Client, Depends(get_supabase_client)],
    admin_client: Annotated[Client, Depends(get_supabase_admin_client)],
    settings: Annotated[Settings, Depends(get_settings)],
):
    """
    Create a new user account with email and password.
    
    Returns access and refresh tokens on successful signup.
    Requires a valid access code.
    """
    # Validate access code
    access_code_result = admin_client.table("access_codes").select("*").eq(
        "code", request.access_code.upper().strip()
    ).execute()
    
    if not access_code_result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid access code",
        )
    
    access_code_row = access_code_result.data[0]
    
    # Check if code is already used
    if access_code_row.get("used_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This access code has already been used",
        )
    
    # Check if code is invalidated
    if access_code_row.get("invalidated_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This access code is no longer valid",
        )
    
    # Validate password
    if len(request.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )
    
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
        
        # Mark access code as used
        admin_client.table("access_codes").update({
            "used_at": "now()",
            "used_by": response.user.id,
        }).eq("id", access_code_row["id"]).execute()
        
        if response.session is None:
            # Email confirmation required
            return AuthResponse(
                access_token="",
                refresh_token="",
                token_type="bearer",
                expires_in=0,
                user=UserInfo(
                    id=response.user.id,
                    email=response.user.email or "",
                    created_at=str(response.user.created_at),
                    email_confirmed=False,
                ),
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
            expires_in=response.session.expires_in or 3600,
            user=UserInfo(
                id=response.user.id,
                email=response.user.email or "",
                created_at=str(response.user.created_at),
                email_confirmed=True,
            ),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "already registered" in error_msg or "already been registered" in error_msg:
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
            expires_in=response.session.expires_in or 3600,
            user=UserInfo(
                id=response.user.id,
                email=response.user.email or "",
                created_at=str(response.user.created_at),
                email_confirmed=True,
            ),
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
    current_user: Annotated[User, Depends(get_current_user)],
    admin_client: Annotated[Client, Depends(get_supabase_admin_client)],
):
    """
    Sign out the current user session.
    
    Requires a valid access token in the Authorization header.
    Invalidates all sessions for the user on the server side.
    """
    try:
        # Use admin client to sign out user by ID (invalidates all sessions)
        admin_client.auth.admin.sign_out(current_user.id)
        return MessageResponse(message="Successfully logged out")
    except Exception:
        # Even if server-side logout fails, client should clear tokens
        # Return success to avoid confusion
        return MessageResponse(message="Successfully logged out")


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
            expires_in=response.session.expires_in or 3600,
            user=UserInfo(
                id=response.user.id,
                email=response.user.email or "",
                created_at=str(response.user.created_at),
                email_confirmed=True,
            ),
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
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Get the current authenticated user's information.
    
    Requires a valid access token in the Authorization header.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email or "",
        created_at=str(current_user.created_at),
        updated_at=str(current_user.updated_at) if current_user.updated_at else None,
        user_metadata=current_user.user_metadata or {},
        is_admin=is_user_admin(current_user),
    )
