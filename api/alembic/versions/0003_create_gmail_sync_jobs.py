"""create gmail_sync_jobs table

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "gmail_sync_jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True), nullable=False),
        sa.Column("celery_task_id", sa.String(200), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("emails_scanned", sa.Integer, nullable=False, server_default="0"),
        sa.Column("passes_found", sa.Integer, nullable=False, server_default="0"),
        sa.Column("passes_saved", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error_message", sa.String(500), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["auth.users.id"], ondelete="CASCADE"),
        schema="public",
    )
    op.create_index("ix_gmail_sync_jobs_user_id", "gmail_sync_jobs", ["user_id"], schema="public")


def downgrade() -> None:
    op.drop_index("ix_gmail_sync_jobs_user_id", table_name="gmail_sync_jobs", schema="public")
    op.drop_table("gmail_sync_jobs", schema="public")
