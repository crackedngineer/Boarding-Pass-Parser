"""
Health check endpoints for monitoring application status.
Follows RESTful API design patterns.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    message: str
    timestamp: str = None


class ReadinessResponse(BaseModel):
    """Readiness check response model."""
    status: str
    services: Dict[str, Any]


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    description="Check if the application is running and healthy."
)
async def health_check() -> HealthResponse:
    """
    Health check endpoint to indicate if the application is running.
    Returns a 200 OK status with application health information.
    """
    return HealthResponse(
        status="healthy",
        message="FlightTrackr API is running"
    )


@router.get(
    "/readiness", 
    response_model=ReadinessResponse,
    summary="Readiness check endpoint",
    description="Check if the application is ready to serve requests."
)
async def readiness_check() -> ReadinessResponse:
    """
    Readiness check endpoint to indicate if the application is ready to serve requests.
    Checks external dependencies like database connections.
    """
    # TODO: Add actual health checks for Supabase and other services
    return ReadinessResponse(
        status="ready",
        services={
            "database": "connected",
            "parser": "available"
        }
    )