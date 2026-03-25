from fastapi import HTTPException
from supabase import create_client
from backend.core.settings import get_settings

settings = get_settings()
print(settings)
supabase = create_client(settings.supabase_url, settings.supabase_key)

def get_current_user(token: str):
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(401)
    return user