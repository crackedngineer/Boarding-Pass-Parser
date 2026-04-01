"""
Authentication endpoints for OAuth and session management.
Follows RESTful API design and proper error handling.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import Optional, Dict, Any
from dependency_injector.wiring import Provide, inject

from core.dependencies import Container, get_auth_service
from services.auth_service import AuthService
from core.exceptions import AuthenticationException, AuthorizationException


router = APIRouter(prefix="/auth")
security = HTTPBearer()


class AuthResponse(BaseModel):
    """Authentication response model."""
    access_token: str
    refresh_token: str
    user: Dict[str, Any]
    expires_in: int


class UserResponse(BaseModel):
    """User information response model."""
    id: str
    email: str
    user_metadata: Dict[str, Any]
    app_metadata: Dict[str, Any]


class TokenRefreshRequest(BaseModel):
    """Token refresh request model."""
    refresh_token: str


@router.post(
    "/google/signin",
    response_model=AuthResponse,
    summary="Sign in with Google",
    description="Authenticate user using Google OAuth provider."
)
@inject
async def google_signin(
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Initiate Google OAuth authentication flow.
    
    Returns:
        Authentication response with tokens and user information
    """
    try:
        result = await auth_service.authenticate_with_google()
        
        return AuthResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user=result.user,
            expires_in=result.session.expires_in or 3600
        )
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get current authenticated user information."
)
@inject
async def get_current_user(
    authorization: str = Header(..., description="Bearer token"),
    auth_service: AuthService = Depends(get_auth_service)
) -> UserResponse:
    """
    Get current user information from access token.
    
    Args:
        authorization: Bearer token from Authorization header
    
    Returns:
        Current user information
    """
    try:
        # Extract token from "Bearer <token>" format
        token = authorization.replace("Bearer ", "")
        user = await auth_service.get_current_user(token)
        
        return UserResponse(**user)
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except AuthorizationException as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.post(
    "/refresh",
    response_model=AuthResponse,
    summary="Refresh access token",
    description="Refresh access token using refresh token."
)
@inject
async def refresh_access_token(
    request: TokenRefreshRequest,
    auth_service: AuthService = Depends(get_auth_service)
) -> AuthResponse:
    """
    Refresh access token using refresh token.
    
    Args:
        request: Token refresh request containing refresh token
        
    Returns:
        New authentication response with fresh tokens
    """
    try:
        result = await auth_service.refresh_token(request.refresh_token)
        
        return AuthResponse(
            access_token=result.session.access_token,
            refresh_token=result.session.refresh_token,
            user=result.user,
            expires_in=result.session.expires_in or 3600
        )
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post(
    "/signout",
    summary="Sign out",
    description="Sign out current user and invalidate session."
)
@inject
async def sign_out(
    authorization: str = Header(..., description="Bearer token"),
    auth_service: AuthService = Depends(get_auth_service)
) -> Dict[str, str]:
    """
    Sign out user and invalidate session.
    
    Args:
        authorization: Bearer token from Authorization header
        
    Returns:
        Success message
    """
    try:
        token = authorization.replace("Bearer ", "")
        success = await auth_service.sign_out(token)
        
        if success:
            return {"message": "Successfully signed out"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sign out failed"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sign out failed: {str(e)}"
        )