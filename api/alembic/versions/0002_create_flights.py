"""create flights table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "flights",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        # Core flight data
        sa.Column("flight_number", sa.String(20), nullable=False),
        sa.Column("airline_code", sa.String(10), nullable=False),
        sa.Column("airline_name", sa.String(100), nullable=True),
        sa.Column("pnr_code", sa.String(20), nullable=True),
        sa.Column("passenger_firstname", sa.String(100), nullable=True),
        sa.Column("passenger_lastname", sa.String(100), nullable=True),
        # Route
        sa.Column("departure_airport", sa.String(10), nullable=False),
        sa.Column("departure_city", sa.String(100), nullable=True),
        sa.Column("arrival_airport", sa.String(10), nullable=False),
        sa.Column("arrival_city", sa.String(100), nullable=True),
        # Schedule
        sa.Column("departure_date", sa.Date, nullable=False),
        sa.Column("departure_time", sa.String(5), nullable=True),
        sa.Column("arrival_time", sa.String(5), nullable=True),
        sa.Column("duration_minutes", sa.Integer, nullable=True),
        # Cabin / Seat
        sa.Column("seat_number", sa.String(10), nullable=True),
        sa.Column("cabin_class", sa.String(5), nullable=True),
        sa.Column("boarding_group", sa.String(10), nullable=True),
        sa.Column("gate", sa.String(10), nullable=True),
        sa.Column("terminal", sa.String(10), nullable=True),
        # Status / Source
        sa.Column("status", sa.String(20), nullable=False, server_default="upcoming"),
        sa.Column("source", sa.String(20), nullable=False, server_default="gmail"),
        # Deduplication
        sa.Column("gmail_message_id", sa.String(50), nullable=True),
        # Audit
        sa.Column("parsed_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "gmail_message_id", name="uq_flights_user_gmail_msg"),
        sa.UniqueConstraint("user_id", "pnr_code", "flight_number", "departure_date", name="uq_flights_user_pnr_flight_date"),
        schema="public",
    )
    op.create_index("ix_flights_user_id", "flights", ["user_id"], schema="public")
    op.create_index("ix_flights_user_id_status", "flights", ["user_id", "status"], schema="public")


def downgrade() -> None:
    op.drop_index("ix_flights_user_id_status", table_name="flights", schema="public")
    op.drop_index("ix_flights_user_id", table_name="flights", schema="public")
    op.drop_table("flights", schema="public")
