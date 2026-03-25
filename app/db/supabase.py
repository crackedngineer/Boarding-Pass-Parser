from supabase import create_client
from app.core.settings import settings

def get_supabase_client():
    print(settings)
    raise ValueError("Supabase URL and/or Key are not set")