from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.db.supabase import get_supabase_client
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["User"])
security = HTTPBearer()


class UserProfileResponse(BaseModel):
    id: str
    email: Optional[str]
    name: Optional[str]
    avatar_url: Optional[str]


@router.get("/profile", response_model=UserProfileResponse, summary="Get current user profile")
async def get_user_profile(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_id: str = Depends(get_current_user),
) -> UserProfileResponse:
    try:
        supabase = get_supabase_client()
        resp = supabase.auth.get_user(credentials.credentials)
        if not resp or not resp.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = resp.user
        metadata = user.user_metadata or {}
        return UserProfileResponse(
            id=str(user.id),
            email=user.email,
            name=metadata.get("full_name") or metadata.get("name"),
            avatar_url=metadata.get("avatar_url"),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {e}")
