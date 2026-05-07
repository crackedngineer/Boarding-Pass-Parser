import uuid
from datetime import datetime, date
from sqlalchemy import String, DateTime, Date, Integer, func, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class Flight(Base):
    __tablename__ = "flights"
    __table_args__ = (
        UniqueConstraint("user_id", "gmail_message_id", name="uq_flights_user_gmail_msg"),
        UniqueConstraint("user_id", "pnr_code", "flight_number", "departure_date", name="uq_flights_user_pnr_flight_date"),
        Index("ix_flights_user_id_status", "user_id", "status"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    # ── Core flight data ────────────────────────────────────────────────────
    flight_number: Mapped[str] = mapped_column(String(20), nullable=False)
    airline_code: Mapped[str] = mapped_column(String(10), nullable=False)
    airline_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pnr_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    passenger_firstname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    passenger_lastname: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ── Route ───────────────────────────────────────────────────────────────
    departure_airport: Mapped[str] = mapped_column(String(10), nullable=False)
    departure_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arrival_airport: Mapped[str] = mapped_column(String(10), nullable=False)
    arrival_city: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # ── Schedule ────────────────────────────────────────────────────────────
    departure_date: Mapped[date] = mapped_column(Date, nullable=False)
    departure_time: Mapped[str | None] = mapped_column(String(5), nullable=True)   # "HH:MM"
    arrival_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Cabin / Seat ────────────────────────────────────────────────────────
    seat_number: Mapped[str | None] = mapped_column(String(10), nullable=True)
    cabin_class: Mapped[str | None] = mapped_column(String(5), nullable=True)
    boarding_group: Mapped[str | None] = mapped_column(String(10), nullable=True)
    gate: Mapped[str | None] = mapped_column(String(10), nullable=True)
    terminal: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # ── Status / Source ─────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="upcoming")
    source: Mapped[str] = mapped_column(String(20), nullable=False, default="gmail")

    # ── Deduplication ───────────────────────────────────────────────────────
    gmail_message_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Audit ───────────────────────────────────────────────────────────────
    parsed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())