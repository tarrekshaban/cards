from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client

from .config import Settings, get_settings

# HTTP Bearer token extractor
security = HTTPBearer()


def get_supabase_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> Client:
    """Get Supabase client instance."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin_client(
    settings: Annotated[Settings, Depends(get_settings)],
) -> Client:
    """Get Supabase admin client with service key for privileged operations."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    """
    Validate JWT token and return current user.
    
    Extracts the Bearer token from Authorization header,
    validates it with Supabase, and returns the user object.
    """
    token = credentials.credentials
    
    try:
        # Create a client and get the user from the token
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        user_response = supabase.auth.get_user(token)
        
        if user_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user_response.user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
