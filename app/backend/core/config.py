"""
Application configuration using Pydantic for validation and type safety.
"""

from pydantic import BaseModel, Field
from typing import List
from core.settings import get_settings


class ApplicationConfig(BaseModel):
    """
    Application configuration derived from settings with defaults.
    """
    # App metadata
    app_name: str = Field(default="FlightTrackr API")
    app_version: str = Field(default="1.0.0") 
    app_description: str = Field(default="API for parsing boarding passes and managing user data.")
    
    # Environment
    environment: str = Field(default="development")
    debug: bool = Field(default=False)
    
    # Security
    allowed_origins: List[str] = Field(default=["*"])
    
    # Database
    supabase_url: str
    supabase_key: str
    
    # OAuth
    google_client_id: str = None
    google_client_secret: str = None
    google_redirect_uri: str = None
    
    # Logging
    log_level: str = Field(default="INFO")

    def __init__(self):
        settings = get_settings()
        super().__init__(
            app_name=settings.app_name,
            app_version=settings.app_version,
            app_description=settings.app_description,
            environment=settings.environment,
            debug=settings.debug,
            allowed_origins=settings.allowed_origins,
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_key,
            google_client_id=settings.google_client_id,
            google_client_secret=settings.google_client_secret,
            google_redirect_uri=settings.google_redirect_uri,
            log_level=settings.log_level
        )