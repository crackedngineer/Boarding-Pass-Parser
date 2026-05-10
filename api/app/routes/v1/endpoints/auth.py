import logging
from typing import Dict, Any, Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.settings import get_settings, Settings
from app.core.dependencies import get_auth_service, get_current_user, get_db_session
import uuid as _uuid
from app.services.auth_service import AuthService
from app.services.oauth_token_service import upsert_token, get_token
from app.models.gmail_sync_job import GmailSyncJob
from app.tasks.gmail_sync import sync_gmail_boarding_passes

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth")
_bearer = HTTPBearer(auto_error=False)

PKCE_MAX_AGE = 600  # 10 minutes
PKCE_COOKIE_NAME = "pkce_verifier"


def _set_auth_cookies(response: Response, session) -> None:
    if session is None:
        return
    response.set_cookie(
        key="access_token",
        value=session.access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=3600,
    )
    response.set_cookie(
        key="refresh_token",
        value=session.refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", samesite="lax")
    response.delete_cookie("refresh_token", samesite="lax")


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


class CallbackRequest(BaseModel):
    code: str


@router.post(
    "/google/signin", response_model=GoogleSignInResponse, summary="Sign in with Google"
)
async def google_signin(
    response: Response,
    auth_service: AuthService = Depends(get_auth_service),
) -> GoogleSignInResponse:
    data = await auth_service.authenticate_with_google()
    # ✅ Store verifier in secure cookie
    response.set_cookie(
        key=PKCE_COOKIE_NAME,
        value=str(data["code_verifier"]),
        httponly=True,
        secure=False,  # ⚠️ set True in production (HTTPS)
        samesite="lax",
        max_age=PKCE_MAX_AGE,
    )
    return GoogleSignInResponse(url=data["url"])


@router.post("/callback", summary="OAuth callback — sets HttpOnly session cookies")
async def auth_callback(
    body: CallbackRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db_session),
    auth_service: AuthService = Depends(get_auth_service),
    settings: Settings = Depends(get_settings),
):
    settings = get_settings()
    try:
        code_verifier = request.cookies.get("pkce_verifier")
        if not code_verifier:
            raise HTTPException(400, "Missing PKCE verifier cookie")

        result = auth_service.exchange_code_for_session(
            body.code, str(settings.google_redirect_uri), code_verifier
        )

        # cleanup cookie
        response.delete_cookie("pkce_verifier")
    except Exception as exc:
        logger.error("Code exchange failed: %s", exc)
        raise HTTPException(status_code=400, detail="OAuth code exchange failed")

    session = result.session
    user = result.user
    _set_auth_cookies(response, session)

    # Store Google tokens for Gmail sync
    if not user or not user.id:
        raise HTTPException(
            status_code=400, detail="User ID not found in token exchange result"
        )

    try:
        refresh_tok, access_tok = auth_service.get_google_tokens(
            str(settings.supabase_url),
            str(settings.supabase_service_role_key),
            str(user.id),
        )
        existing = await get_token(db, str(user.id))
        is_first = existing is None
        await upsert_token(
            session=db,
            user_id=str(user.id),
            refresh_token=refresh_tok,
            access_token=access_tok,
            scope="https://www.googleapis.com/auth/gmail.readonly",
        )
        if is_first:
            job = GmailSyncJob(user_id=_uuid.UUID(str(user.id)), status="pending")
            db.add(job)
            await db.flush()
            task = sync_gmail_boarding_passes.delay(str(user.id), str(job.id))
            job.celery_task_id = task.id
            logger.info(
                "First Google connect — auto-sync job=%s user=%s", job.id, user.id
            )
        await db.commit()
    except Exception as exc:
        logger.warning("Could not store Google tokens: %s", exc)

    return {"success": True, "user_id": str(user.id)}


@router.get("/me", response_model=UserResponse, summary="Get current user")
async def get_me(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
    auth_service=Depends(get_auth_service),
) -> UserResponse:
    token = (
        credentials.credentials if credentials else request.cookies.get("access_token")
    )
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = await auth_service.get_current_user(token)
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
    response: Response,
    auth_service=Depends(get_auth_service),
) -> Dict[str, str]:
    await auth_service.sign_out()
    _clear_auth_cookies(response)
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
    return {
        "message": "Google account connected successfully",
        "sync_triggered": is_first,
    }
