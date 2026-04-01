from typing import Optional
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables or .env file.
    """
    # OAuth Settings
    google_client_id: Optional[str] = None
    google_redirect_uri: Optional[str] = None
    google_client_secret: Optional[str] = None

    # Database Settings
    supabase_url: str
    supabase_key: str

    # Application Settings
    app_name: str = "FlightTrackr API"
    app_version: str = "1.0.0"
    app_description: str = "API for parsing boarding passes and managing user data."
    environment: str = "development"
    debug: bool = False
    
    # Security Settings
    allowed_origins: list[str] = ["*"]
    jwt_secret_key: Optional[str] = None
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Logging
    log_level: str = "INFO"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False
    )


@lru_cache
def get_settings() -> Settings:
    """
    Creates a cached instance of the settings.
    Using lru_cache ensures the .env isn't re-read on every request.
    """
    return Settings()