from supabase import create_client
from backend.core.settings import get_settings

def get_supabase_client():
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_key:
        raise ValueError("Supabase URL and/or Key are not set")
    return create_client(settings.supabase_url, settings.supabase_key)