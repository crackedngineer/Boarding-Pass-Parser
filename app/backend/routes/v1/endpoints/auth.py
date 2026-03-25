from fastapi import APIRouter
# from app.core.dependencies import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["core"],
)

from fastapi import APIRouter, Depends
from backend.services.google_oauth import GoogleOAuthService

router = APIRouter()

@router.get("/gmail/connect")
# def connect_gmail(user=Depends(get_current_user)):
def connect_gmail():
    url = GoogleOAuthService().generate_auth_url("user.id")
    return {"url": url}