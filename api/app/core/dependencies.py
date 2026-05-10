"""
Dependency injection container using dependency-injector.
Provides centralized dependency management following SOLID principles.
"""

import logging
from app.services.auth_service import AuthService
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import AsyncGenerator, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from redis.asyncio import Redis

from app.db.supabase import get_supabase_client
from app.core.redis import get_redis_client
from app.db.session import get_db_session as _get_db_session

logger = logging.getLogger(__name__)
_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> str:
    """Verify Supabase JWT from HttpOnly cookie or Authorization header."""
    token: Optional[str] = None
    if credentials:
        token = credentials.credentials
    else:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        supabase = get_supabase_client()
        resp = supabase.auth.get_user(token)
        if not resp or not resp.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return str(resp.user.id)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning("Token validation failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency — yields an async SQLAlchemy session."""
    async for session in _get_db_session():
        yield session


async def get_auth_service(
    redis_client: Redis = Depends(get_redis_client),
) -> AuthService:
    """Factory for AuthService with injected dependencies."""
    return AuthService(supabase_client=get_supabase_client(), redis_client=redis_client)
