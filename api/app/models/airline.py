from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin


class Airline(Base, TimestampMixin):
    __tablename__ = "airlines"
    __table_args__ = ({"schema": "public"},)

    id: Mapped[int] = mapped_column(primary_key=True)
    name = mapped_column(String(100), nullable=False)
    iata_code = mapped_column(String(10), nullable=False, unique=True)
    icao_code = mapped_column(String(10), nullable=True, unique=True)
    alias = mapped_column(String(100), nullable=True)
    callsign = mapped_column(String(50), nullable=True)
    country = mapped_column(String(50), nullable=True)
    active = mapped_column(Boolean, nullable=False, default=True)
