"""
FlightTrackr API - Main application entry point.
Uses application factory pattern for better structure and testability.
"""

from core.app_factory import get_application

# Create the FastAPI application instance using the factory
app = get_application()


if __name__ == "__main__":
    import uvicorn
    from core.settings import get_settings
    
    settings = get_settings()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )
