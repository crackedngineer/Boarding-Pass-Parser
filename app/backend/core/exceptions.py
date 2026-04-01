"""
Custom exceptions and global exception handlers for the application.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
from typing import Union


class FlightTrackrException(Exception):
    """Base exception class for FlightTrackr application."""
    
    def __init__(self, message: str, code: str = "INTERNAL_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class BusinessLogicException(FlightTrackrException):
    """Exception raised for business logic violations."""
    
    def __init__(self, message: str, code: str = "BUSINESS_LOGIC_ERROR"):
        super().__init__(message, code)


class ValidationException(FlightTrackrException):
    """Exception raised for validation errors."""
    
    def __init__(self, message: str, code: str = "VALIDATION_ERROR"):
        super().__init__(message, code)


class BoardingPassParsingException(BusinessLogicException):
    """Exception raised when boarding pass parsing fails."""
    
    def __init__(self, message: str = "Failed to parse boarding pass"):
        super().__init__(message, "BOARDING_PASS_PARSING_ERROR")


class AuthenticationException(FlightTrackrException):
    """Exception raised for authentication failures."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTHENTICATION_ERROR")


class AuthorizationException(FlightTrackrException):
    """Exception raised for authorization failures."""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(message, "AUTHORIZATION_ERROR")


def setup_exception_handlers(app: FastAPI) -> None:
    """Set up global exception handlers."""
    
    @app.exception_handler(FlightTrackrException)
    async def custom_exception_handler(
        request: Request, exc: FlightTrackrException
    ) -> JSONResponse:
        """Handle custom FlightTrackr exceptions."""
        logging.error(f"FlightTrackr exception: {exc.code} - {exc.message}")
        
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        if isinstance(exc, ValidationException):
            status_code = status.HTTP_400_BAD_REQUEST
        elif isinstance(exc, AuthenticationException):
            status_code = status.HTTP_401_UNAUTHORIZED
        elif isinstance(exc, AuthorizationException):
            status_code = status.HTTP_403_FORBIDDEN
        elif isinstance(exc, BusinessLogicException):
            status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
        
        return JSONResponse(
            status_code=status_code,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "type": exc.__class__.__name__
                }
            }
        )
    
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        """Handle HTTP exceptions."""
        logging.error(f"HTTP exception: {exc.status_code} - {exc.detail}")
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {
                    "code": f"HTTP_{exc.status_code}",
                    "message": exc.detail,
                    "type": "HTTPException"
                }
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle request validation errors."""
        logging.error(f"Validation error: {exc.errors()}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": exc.errors(),
                    "type": "ValidationError"
                }
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Handle all other exceptions."""
        logging.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An internal server error occurred",
                    "type": "InternalError"
                }
            }
        )