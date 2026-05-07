from __future__ import annotations
from datetime import date, datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict
from app.models.flight import Flight


FlightStatus = Literal["upcoming", "completed", "cancelled"]
FlightSource = Literal["gmail", "manual"]


class FlightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    flight_number: str
    airline: str                  # = airline_name or airline_code
    airline_code: str
    passenger_name: Optional[str]  # firstname + lastname joined
    departure_airport: str
    departure_city: Optional[str]
    arrival_airport: str
    arrival_city: Optional[str]
    departure_time: Optional[str]
    arrival_time: Optional[str]
    date: str                      # "YYYY-MM-DD"
    seat: Optional[str]
    pnr: Optional[str]
    gate: Optional[str]
    terminal: Optional[str]
    class_of_service: Optional[str]
    status: str
    duration: Optional[str]
    source: str
    parsed_at: str

    @classmethod
    def from_orm(cls, f: Flight) -> FlightResponse:
        parts = [f.passenger_firstname, f.passenger_lastname]
        passenger_name = " ".join(p for p in parts if p) or None
        return cls(
            id=str(f.id),
            flight_number=f.flight_number,
            airline=f.airline_name or f.airline_code,
            airline_code=f.airline_code,
            passenger_name=passenger_name,
            departure_airport=f.departure_airport,
            departure_city=f.departure_city,
            arrival_airport=f.arrival_airport,
            arrival_city=f.arrival_city,
            departure_time=f.departure_time,
            arrival_time=f.arrival_time,
            date=f.departure_date.isoformat() if f.departure_date else "",
            seat=f.seat_number,
            pnr=f.pnr_code,
            gate=f.gate,
            terminal=f.terminal,
            class_of_service=f.cabin_class,
            status=f.status,
            duration=None,
            source=f.source,
            parsed_at=f.parsed_at.isoformat() if f.parsed_at else "",
        )


class FlightsListResponse(BaseModel):
    flights: list[FlightResponse]
    total: int
