import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.models.flight import Flight
from app.parsers.dataclass import ParsedBoardingPass
from app.parsers.enum import AirlineCodeEnum
import logging

logger = logging.getLogger(__name__)

# Map airline code → display name
_AIRLINE_NAMES: dict[str, str] = {
    member.value: member.name.replace("_", " ").title()
    for member in AirlineCodeEnum
}
_AIRLINE_NAMES.update({"6E": "IndiGo", "QP": "Akasa Air"})


def _parse_departure(dep_time_str: Optional[str]) -> tuple[Optional[date], Optional[str]]:
    """
    Normalise the departure_time field from ParsedBoardingPass into (date, HH:MM).
    BCBP decoder produces "dd/Mon" (no year); airline parsers may produce full ISO.
    """
    if not dep_time_str:
        return None, None
    try:
        # Try full ISO first
        dt = datetime.fromisoformat(dep_time_str.replace("Z", "+00:00"))
        return dt.date(), dt.strftime("%H:%M")
    except ValueError:
        pass
    try:
        # "dd/Mon" — assume nearest future occurrence
        from datetime import timedelta
        d = datetime.strptime(dep_time_str, "%d/%b")
        today = date.today()
        candidate = d.replace(year=today.year).date()
        if candidate < today:
            candidate = candidate.replace(year=today.year + 1)
        return candidate, None
    except ValueError:
        pass
    return None, None


def parsed_to_flight(
    parsed: ParsedBoardingPass,
    user_id: str,
    gmail_message_id: Optional[str] = None,
) -> Flight:
    dep_date, dep_time = _parse_departure(parsed.departure_time)
    status = "upcoming" if dep_date and dep_date >= date.today() else "completed"
    airline_code = (parsed.operator_code or "").strip()
    flight_number = f"{airline_code}{(parsed.flight_number or '').strip()}"

    return Flight(
        user_id=uuid.UUID(user_id) if isinstance(user_id, str) else user_id,
        flight_number=flight_number,
        airline_code=airline_code,
        airline_name=_AIRLINE_NAMES.get(airline_code),
        pnr_code=(parsed.pnr_code or "").strip() or None,
        passenger_firstname=parsed.passenger_firstname,
        passenger_lastname=parsed.passenger_lastname,
        departure_airport=(parsed.origin or "").strip().upper(),
        arrival_airport=(parsed.destination or "").strip().upper(),
        departure_date=dep_date or date.today(),
        departure_time=dep_time,
        seat_number=parsed.seat_number,
        cabin_class=parsed.cabin_class,
        boarding_group=parsed.boarding_group,
        status=status,
        source="gmail",
        gmail_message_id=gmail_message_id,
    )


# ── Async CRUD (FastAPI) ───────────────────────────────────────────────────────

async def list_flights(
    session: AsyncSession,
    user_id: str,
    status_filter: Optional[str] = None,
) -> list[Flight]:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    stmt = select(Flight).where(Flight.user_id == uid).order_by(Flight.departure_date.desc())
    if status_filter:
        stmt = stmt.where(Flight.status == status_filter)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_flight(session: AsyncSession, user_id: str, flight_id: str) -> Optional[Flight]:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    fid = uuid.UUID(flight_id) if isinstance(flight_id, str) else flight_id
    result = await session.execute(
        select(Flight).where(Flight.id == fid, Flight.user_id == uid)
    )
    return result.scalar_one_or_none()


async def delete_flight(session: AsyncSession, user_id: str, flight_id: str) -> bool:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    fid = uuid.UUID(flight_id) if isinstance(flight_id, str) else flight_id
    result = await session.execute(
        delete(Flight).where(Flight.id == fid, Flight.user_id == uid)
    )
    return result.rowcount > 0


# ── Sync upsert (Celery worker) ───────────────────────────────────────────────

def upsert_flight_sync(session: Session, flight: Flight) -> Flight:
    """Insert a flight, skipping silently if either dedup key already exists."""
    # Primary dedup: same email attachment
    if flight.gmail_message_id:
        existing = session.execute(
            select(Flight).where(
                Flight.user_id == flight.user_id,
                Flight.gmail_message_id == flight.gmail_message_id,
            )
        ).scalar_one_or_none()
        if existing:
            return existing

    # Secondary dedup: same flight appearing in a different email
    # (mirrors the uq_flights_user_pnr_flight_date DB constraint)
    if flight.pnr_code and flight.flight_number and flight.departure_date:
        existing = session.execute(
            select(Flight).where(
                Flight.user_id == flight.user_id,
                Flight.pnr_code == flight.pnr_code,
                Flight.flight_number == flight.flight_number,
                Flight.departure_date == flight.departure_date,
            )
        ).scalar_one_or_none()
        if existing:
            # Backfill gmail_message_id if the earlier record didn't have one
            if flight.gmail_message_id and not existing.gmail_message_id:
                existing.gmail_message_id = flight.gmail_message_id
            return existing

    session.add(flight)
    session.flush()
    return flight


def get_existing_gmail_ids_sync(session: Session, user_id: str, gmail_ids: list[str]) -> set[str]:
    """Bulk check which gmail_message_ids are already in the DB."""
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    rows = session.execute(
        select(Flight.gmail_message_id).where(
            Flight.user_id == uid,
            Flight.gmail_message_id.in_(gmail_ids),
        )
    ).scalars().all()
    return set(rows)
