import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import get_settings, Settings
from app.core.dependencies import get_auth_service, get_current_user, get_db_session
import uuid as _uuid
from app.services.oauth_token_service import upsert_token, get_token
from app.models.gmail_sync_job import GmailSyncJob
from app.tasks.gmail_sync import sync_gmail_boarding_passes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")
_bearer = HTTPBearer()


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: Dict[str, Any]
    expires_in: int


class GoogleSignInResponse(BaseModel):
    url: str


class GoogleTokenRequest(BaseModel):
    google_refresh_token: str
    google_access_token: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    email: str
    user_metadata: Dict[str, Any]
    app_metadata: Dict[str, Any]


class TokenRefreshRequest(BaseModel):
    refresh_token: str


@router.post(
    "/google/signin", response_model=GoogleSignInResponse, summary="Sign in with Google"
)
async def google_signin(
    auth_service=Depends(get_auth_service),
) -> GoogleSignInResponse:
    data = await auth_service.authenticate_with_google()
    return GoogleSignInResponse(url=data["url"])


@router.get("/me", response_model=UserResponse, summary="Get current user")
async def get_me(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    auth_service=Depends(get_auth_service),
) -> UserResponse:
    user = await auth_service.get_current_user(credentials.credentials)
    return UserResponse(**user)


@router.post("/refresh", response_model=AuthResponse, summary="Refresh access token")
async def refresh_access_token(
    request: TokenRefreshRequest,
    auth_service=Depends(get_auth_service),
) -> AuthResponse:
    result = await auth_service.refresh_token(request.refresh_token)
    u = result.user
    return AuthResponse(
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user={
            "id": str(u.id),
            "email": u.email,
            "user_metadata": u.user_metadata or {},
            "app_metadata": u.app_metadata or {},
        },
        expires_in=result.session.expires_in or 3600,
    )


@router.post("/signout", summary="Sign out")
async def sign_out(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    auth_service=Depends(get_auth_service),
) -> Dict[str, str]:
    await auth_service.sign_out()
    return {"message": "Successfully signed out"}


@router.post(
    "/store-google-token", summary="Persist Google OAuth tokens from implicit flow"
)
async def store_google_token(
    request: GoogleTokenRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    # Detect first-time Google connection before upserting
    existing = await get_token(db, user_id)
    is_first = existing is None

    await upsert_token(
        session=db,
        user_id=user_id,
        refresh_token=request.google_refresh_token,
        access_token=request.google_access_token,
        scope="https://www.googleapis.com/auth/gmail.readonly",
    )

    if is_first:
        job = GmailSyncJob(user_id=_uuid.UUID(user_id), status="pending")
        db.add(job)
        await db.flush()
        task = sync_gmail_boarding_passes.delay(user_id, str(job.id))
        job.celery_task_id = task.id
        logger.info("First Google connect — auto-sync job=%s user=%s", job.id, user_id)

    await db.commit()
    logger.info("Stored Google tokens for user %s", user_id)
    return {"message": "Google account connected successfully", "sync_triggered": is_first}
