"""create user_oauth_tokens table

Revision ID: 0001
Revises:
Create Date: 2026-05-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_oauth_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False, server_default="google"),
        sa.Column("refresh_token", sa.String(2048), nullable=False),
        sa.Column("access_token", sa.String(2048), nullable=True),
        sa.Column("token_expiry", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scope", sa.String(1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "provider", name="uq_user_oauth_tokens_user_provider"),
        schema="public",
    )
    op.create_index("ix_user_oauth_tokens_user_id", "user_oauth_tokens", ["user_id"], schema="public")


def downgrade() -> None:
    op.drop_index("ix_user_oauth_tokens_user_id", table_name="user_oauth_tokens", schema="public")
    op.drop_table("user_oauth_tokens", schema="public")
