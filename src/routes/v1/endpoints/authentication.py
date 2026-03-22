from fastapi import APIRouter

router = APIRouter(
    prefix="/digipin",
    tags=["core"],
)

@router.get("/google/login")
def login_google():
    pass