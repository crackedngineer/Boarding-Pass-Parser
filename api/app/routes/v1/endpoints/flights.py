from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import get_current_user, get_db_session
from app.services import flight_service
from app.schemas.flight_schema import TripResponse, TripsListResponse

router = APIRouter(prefix="/trips", tags=["Trips"])


@router.get("/", response_model=TripsListResponse, summary="List user trips")
async def list_trips(
    status: Optional[str] = Query(None, description="Filter: upcoming | completed"),
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TripsListResponse:
    trips = await flight_service.list_trips(session, user_id, status_filter=status)
    return TripsListResponse(trips=[TripResponse.from_orm(t) for t in trips], total=len(trips))


@router.get("/{trip_id}", response_model=TripResponse, summary="Get trip by ID")
async def get_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> TripResponse:
    trip = await flight_service.get_trip(session, user_id, trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return TripResponse.from_orm(trip)


@router.delete("/{trip_id}", status_code=204, summary="Delete trip")
async def delete_trip(
    trip_id: str,
    user_id: str = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
) -> None:
    deleted = await flight_service.delete_trip(session, user_id, trip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")
