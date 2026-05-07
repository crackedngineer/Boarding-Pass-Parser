import uuid
from datetime import datetime, timezone
from typing import Optional
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user_oauth_token import UserOAuthToken
from app.core.settings import get_settings
import logging

logger = logging.getLogger(__name__)


_fernet_instance: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = get_settings().oauth_token_encryption_key
        if not key:
            raise RuntimeError("OAUTH_TOKEN_ENCRYPTION_KEY is not set in environment")
        _fernet_instance = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet_instance


def encrypt_token(token: str) -> str:
    return _get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return _get_fernet().decrypt(encrypted.encode()).decode()


async def upsert_token(
    session: AsyncSession,
    user_id: str,
    refresh_token: str,
    access_token: Optional[str] = None,
    token_expiry: Optional[datetime] = None,
    scope: Optional[str] = None,
    provider: str = "google",
) -> UserOAuthToken:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await session.execute(
        select(UserOAuthToken).where(
            UserOAuthToken.user_id == uid,
            UserOAuthToken.provider == provider,
        )
    )
    record = result.scalar_one_or_none()

    encrypted_refresh = encrypt_token(refresh_token)
    encrypted_access = encrypt_token(access_token) if access_token else None

    if record:
        record.refresh_token = encrypted_refresh
        record.access_token = encrypted_access
        record.token_expiry = token_expiry
        record.scope = scope
    else:
        record = UserOAuthToken(
            user_id=uid,
            provider=provider,
            refresh_token=encrypted_refresh,
            access_token=encrypted_access,
            token_expiry=token_expiry,
            scope=scope,
        )
        session.add(record)

    await session.flush()
    return record


async def get_token(
    session: AsyncSession,
    user_id: str,
    provider: str = "google",
) -> Optional[UserOAuthToken]:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await session.execute(
        select(UserOAuthToken).where(
            UserOAuthToken.user_id == uid,
            UserOAuthToken.provider == provider,
        )
    )
    return result.scalar_one_or_none()


def get_token_sync(session: Session, user_id: str, provider: str = "google") -> Optional[UserOAuthToken]:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    return session.execute(
        select(UserOAuthToken).where(
            UserOAuthToken.user_id == uid,
            UserOAuthToken.provider == provider,
        )
    ).scalar_one_or_none()
