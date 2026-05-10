"""create user_mail_connections table

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-09
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
        "user_mail_connections",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(30), nullable=False),
        sa.Column("provider_email", sa.String(255), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=True),
        sa.Column("encrypted_tokens", sa.Text, nullable=False),
        sa.Column("scopes", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("connected_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("last_synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint(
            "user_id", "provider", "provider_email",
            name="uq_mail_connections_user_provider_email",
        ),
        schema="public",
    )
    op.create_index("ix_mail_connections_user_id", "user_mail_connections", ["user_id"], schema="public")
    op.create_index("ix_mail_connections_user_status", "user_mail_connections", ["user_id", "status"], schema="public")


def downgrade() -> None:
    op.drop_index("ix_mail_connections_user_status", table_name="user_mail_connections", schema="public")
    op.drop_index("ix_mail_connections_user_id", table_name="user_mail_connections", schema="public")
    op.drop_table("user_mail_connections", schema="public")
