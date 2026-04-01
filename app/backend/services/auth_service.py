"""
Authentication service handling user authentication and authorization.
Implements OAuth2 flows and JWT token management.
"""

from typing import Optional, Dict, Any
from supabase import Client
from core.exceptions import AuthenticationException, AuthorizationException
import logging


class AuthService:
    """Service for handling authentication operations."""
    
    def __init__(self, supabase_client: Client):
        self.supabase_client = supabase_client
        self.logger = logging.getLogger(__name__)
    
    async def authenticate_with_google(
        self, 
        provider: str = "google",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Authenticate user with Google OAuth provider.
        
        Args:
            provider: OAuth provider name
            options: Additional options for authentication
            
        Returns:
            Authentication result with session and user data
            
        Raises:
            AuthenticationException: If authentication fails
        """
        try:
            result = self.supabase_client.auth.sign_in_with_oauth({
                "provider": provider,
                "options": options or {}
            })
            
            if not result:
                raise AuthenticationException("OAuth authentication failed")
                
            self.logger.info(f"User authenticated successfully with {provider}")
            return result
            
        except Exception as e:
            self.logger.error(f"Authentication error: {str(e)}")
            raise AuthenticationException(f"Authentication failed: {str(e)}")
    
    async def get_current_user(self, access_token: str) -> Dict[str, Any]:
        """
        Get current user information from access token.
        
        Args:
            access_token: JWT access token
            
        Returns:
            User information
            
        Raises:
            AuthenticationException: If token is invalid
            AuthorizationException: If user is not authorized
        """
        try:
            user_response = self.supabase_client.auth.get_user(access_token)
            
            if not user_response or not user_response.user:
                raise AuthenticationException("Invalid or expired token")
            
            return {
                "id": user_response.user.id,
                "email": user_response.user.email,
                "user_metadata": user_response.user.user_metadata,
                "app_metadata": user_response.user.app_metadata,
            }
            
        except Exception as e:
            self.logger.error(f"Token validation error: {str(e)}")
            raise AuthenticationException("Failed to validate token")
    
    async def sign_out(self, access_token: str) -> bool:
        """
        Sign out user and invalidate session.
        
        Args:
            access_token: User's access token
            
        Returns:
            Success status
        """
        try:
            result = self.supabase_client.auth.sign_out(access_token)
            self.logger.info("User signed out successfully")
            return True
        except Exception as e:
            self.logger.error(f"Sign out error: {str(e)}")
            return False
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New token pair
            
        Raises:
            AuthenticationException: If refresh fails
        """
        try:
            result = self.supabase_client.auth.refresh_access_token(refresh_token)
            
            if not result:
                raise AuthenticationException("Token refresh failed")
                
            return result
            
        except Exception as e:
            self.logger.error(f"Token refresh error: {str(e)}")
            raise AuthenticationException("Failed to refresh token")