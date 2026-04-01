"""
API v1 route aggregation.
This file is now deprecated - routes are included directly in app_factory.py
"""

# This file is kept for backward compatibility but is no longer actively used.
# Routes are now organized by domain and included directly in the application factory.

from fastapi import APIRouter
from .endpoints.auth import router as auth_router

# Legacy router for backward compatibility
routers = APIRouter()
routers.include_router(auth_router, tags=["v1"])