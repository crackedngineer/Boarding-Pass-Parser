from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user, get_db_session
from app.services import flight_service
from app.schemas.flight_schema import FlightResponse, FlightsListResponse

router = APIRouter(prefix="/flights", tags=["Flights"])


@router.get("/", response_model=FlightsListResponse, summary="List user flights")
async def list_flights(
    status: Optional[str] = Query(None, description="Filter by status: upcoming|completed|cancelled"),
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> FlightsListResponse:
    flights = await flight_service.list_flights(session, user_id, status_filter=status)
    return FlightsListResponse(
        flights=[FlightResponse.from_orm(f) for f in flights],
        total=len(flights),
    )


@router.get("/{flight_id}", response_model=FlightResponse, summary="Get flight by ID")
async def get_flight(
    flight_id: str,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> FlightResponse:
    flight = await flight_service.get_flight(session, user_id, flight_id)
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    return FlightResponse.from_orm(flight)


@router.delete("/{flight_id}", status_code=204, summary="Delete flight")
async def delete_flight(
    flight_id: str,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    deleted = await flight_service.delete_flight(session, user_id, flight_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Flight not found")
