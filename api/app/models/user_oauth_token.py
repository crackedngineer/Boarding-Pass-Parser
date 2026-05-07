import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class UserOAuthToken(Base):
    __tablename__ = "user_oauth_tokens"
    __table_args__ = (
        UniqueConstraint("user_id", "provider", name="uq_user_oauth_tokens_user_provider"),
        {"schema": "public"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), nullable=False, default="google")
    refresh_token: Mapped[str] = mapped_column(String(2048), nullable=False)  # Fernet-encrypted
    access_token: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    token_expiry: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    scope: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
