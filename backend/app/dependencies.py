"""FastAPI dependencies for auth and database access."""

from typing import Annotated
from functools import lru_cache
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from gotrue.types import User

from .config import Settings, get_settings

# HTTP Bearer token extractor
security = HTTPBearer()


def is_user_admin(user: User) -> bool:
    """Check if a user has admin privileges."""
    user_metadata = user.user_metadata or {}
    return user_metadata.get("is_admin", False) is True


@lru_cache
def _get_supabase_client(url: str, key: str) -> Client:
    """Create and cache a Supabase client instance."""
    return create_client(url, key)


def get_supabase_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> Client:
    """Get cached Supabase client instance (anon key)."""
    return _get_supabase_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> Client:
    """Get cached Supabase admin client (service key for privileged operations)."""
    return _get_supabase_client(settings.supabase_url, settings.supabase_service_key)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> User:
    """
    Validate JWT token and return current user.
    
    Extracts the Bearer token from Authorization header,
    validates it with Supabase, and returns the User object.
    """
    token = credentials.credentials
    
    try:
        supabase = _get_supabase_client(settings.supabase_url, settings.supabase_anon_key)
        user_response = supabase.auth.get_user(token)
        
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_response.user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


async def require_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Require the current user to have admin privileges.
    
    Use this as a dependency for admin-only endpoints.
    """
    if not is_user_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
