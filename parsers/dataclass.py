from datetime import datetime
from dataclasses import dataclass
from typing import Optional

@dataclass
class BoardingPass:
    raw_data: str


@dataclass
class ParsedBoardingPass:
    pnr_code: Optional[str] = None
    passenger_name: Optional[str] = None
    airline_code: Optional[str] = None
    flight_number: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    seat_number: Optional[str] = None
    boarding_group: Optional[str] = None
    departure_time: Optional[str] = None