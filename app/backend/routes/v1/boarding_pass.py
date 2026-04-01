"""
Boarding pass parsing endpoints.
Handles PDF boarding pass uploads and parsing operations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any
from dependency_injector.wiring import Provide, inject

from core.dependencies import get_boarding_pass_service
from services.parser_service import BoardingPassService
from core.exceptions import BoardingPassParsingException, ValidationException
from parsers.dataclass import ParsedBoardingPass


router = APIRouter(prefix="/boarding-pass")


class UploadResponse(BaseModel):
    """Response model for boarding pass upload."""
    success: bool
    message: str
    data: Dict[str, Any] = None


@router.post(
    "/parse",
    response_model=UploadResponse,
    summary="Parse boarding pass PDF",
    description="Upload and parse a boarding pass PDF file to extract flight information."
)
@inject
async def parse_boarding_pass(
    file: UploadFile = File(..., description="Boarding pass PDF file"),
    parser_service: BoardingPassService = Depends(get_boarding_pass_service)
) -> UploadResponse:
    """
    Parse boarding pass PDF file and extract flight details.
    
    Args:
        file: Uploaded PDF file containing boarding pass
        parser_service: Injected boarding pass parser service
        
    Returns:
        Parsed boarding pass information
        
    Raises:
        HTTPException: If file is invalid or parsing fails
    """
    # Validate file type
    if not file.content_type == "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    # Validate file size (5MB limit)
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size too large. Maximum size is 5MB"
        )
    
    try:
        # Read file content
        pdf_bytes = await file.read()
        
        if not pdf_bytes:
            raise ValidationException("Empty file uploaded")
        
        # Process boarding pass
        result = parser_service.process(pdf_bytes)
        
        return UploadResponse(
            success=True,
            message="Boarding pass parsed successfully",
            data={
                "passenger_name": result.passenger_name,
                "flight_number": result.flight_number,
                "departure_airport": result.departure_airport,
                "arrival_airport": result.arrival_airport,
                "departure_date": result.departure_date.isoformat() if result.departure_date else None,
                "seat_number": result.seat_number,
                "gate": result.gate,
                "terminal": result.terminal,
                "operator_code": result.operator_code,
                "class_of_service": result.class_of_service
            }
        )
        
    except BoardingPassParsingException as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during parsing"
        )


@router.get(
    "/supported-airlines",
    summary="Get supported airlines",
    description="Get list of airlines that can be parsed by the system."
)
async def get_supported_airlines() -> Dict[str, Any]:
    """
    Get list of supported airlines for boarding pass parsing.
    
    Returns:
        List of supported airlines with their codes
    """
    return {
        "supported_airlines": [
            {
                "name": "IndiGo",
                "code": "6E",
                "country": "India",
                "supported_features": ["BCBP", "QR_CODE", "PDF_PARSING"]
            },
            {
                "name": "Akasa Air",
                "code": "QP", 
                "country": "India",
                "supported_features": ["BCBP", "QR_CODE", "PDF_PARSING"]
            }
        ],
        "total_supported": 2,
        "generic_parser": {
            "available": True,
            "description": "Generic IATA parser for other airlines"
        }
    }