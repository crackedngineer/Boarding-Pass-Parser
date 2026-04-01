"""
Application factory for creating FastAPI instances with proper dependency injection.
Follows Clean Architecture and Dependency Injection patterns.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from core.config import ApplicationConfig
from core.exceptions import setup_exception_handlers
from core.middleware import setup_middleware
from routes.v1 import health, boarding_pass
from routes.v1.endpoints import auth
import logging


def create_app(config: ApplicationConfig = None) -> FastAPI:
    """
    Application factory that creates and configures FastAPI application.
    
    Args:
        config: Application configuration instance
        
    Returns:
        Configured FastAPI application
    """
    if config is None:
        config = ApplicationConfig()
    
    app = FastAPI(
        title=config.app_name,
        version=config.app_version,
        description=config.app_description,
        docs_url="/docs" if config.environment != "production" else None,
        redoc_url="/redoc" if config.environment != "production" else None,
    )
    
    # Setup middleware
    setup_middleware(app, config)
    
    # Setup exception handlers
    setup_exception_handlers(app)
    
    # Include routers
    app.include_router(health.router, prefix="/api/v1", tags=["Health"])
    app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
    app.include_router(boarding_pass.router, prefix="/api/v1", tags=["Boarding Pass"])
    
    # Root endpoint
    @app.get("/", include_in_schema=False)
    async def root():
        return {
            "message": f"Welcome to {config.app_name}. Visit /docs for API documentation.",
            "version": config.app_version,
            "environment": config.environment
        }
    
    return app


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler for startup and shutdown events.
    """
    # Startup
    logging.info("🚀 FlightTrackr API starting up...")
    yield
    # Shutdown
    logging.info("🛬 FlightTrackr API shutting down...")


def get_application() -> FastAPI:
    """
    Get the configured application instance.
    """
    config = ApplicationConfig()
    return create_app(config)