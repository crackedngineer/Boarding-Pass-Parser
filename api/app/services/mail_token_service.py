from __future__ import annotations

import uuid
import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.mail.base import MailCredentials
from app.models.mail_connection import UserMailConnection

logger = logging.getLogger(__name__)


async def store_connection(
    db: AsyncSession,
    user_id: str | uuid.UUID,
    provider: str,
    creds: MailCredentials,
) -> UserMailConnection:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    blob = creds.to_encrypted_blob()
    scopes_str = ",".join(creds.scopes) if creds.scopes else None

    result = await db.execute(
        select(UserMailConnection).where(
            UserMailConnection.user_id == uid,
            UserMailConnection.provider == provider,
            UserMailConnection.provider_email == creds.provider_email,
        )
    )
    record = result.scalar_one_or_none()

    if record:
        record.encrypted_tokens = blob
        record.provider_user_id = creds.provider_user_id or record.provider_user_id
        record.scopes = scopes_str
        record.status = "active"
    else:
        record = UserMailConnection(
            user_id=uid,
            provider=provider,
            provider_email=creds.provider_email,
            provider_user_id=creds.provider_user_id or None,
            encrypted_tokens=blob,
            scopes=scopes_str,
            status="active",
        )
        db.add(record)

    await db.flush()
    return record


async def load_connection(
    db: AsyncSession,
    user_id: str | uuid.UUID,
    provider: str,
    provider_email: str,
) -> tuple[UserMailConnection, MailCredentials] | None:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await db.execute(
        select(UserMailConnection).where(
            UserMailConnection.user_id == uid,
            UserMailConnection.provider == provider,
            UserMailConnection.provider_email == provider_email,
            UserMailConnection.status == "active",
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        return None
    creds = MailCredentials.from_encrypted_blob(record.encrypted_tokens)
    return record, creds


async def list_connections(
    db: AsyncSession,
    user_id: str | uuid.UUID,
) -> list[UserMailConnection]:
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await db.execute(
        select(UserMailConnection).where(
            UserMailConnection.user_id == uid,
            UserMailConnection.status != "revoked",
        )
    )
    return list(result.scalars().all())


async def get_connection_by_id(
    db: AsyncSession,
    connection_id: str | uuid.UUID,
    user_id: str | uuid.UUID,
) -> Optional[UserMailConnection]:
    cid = uuid.UUID(connection_id) if isinstance(connection_id, str) else connection_id
    uid = uuid.UUID(user_id) if isinstance(user_id, str) else user_id
    result = await db.execute(
        select(UserMailConnection).where(
            UserMailConnection.id == cid,
            UserMailConnection.user_id == uid,
        )
    )
    return result.scalar_one_or_none()


async def revoke_connection(
    db: AsyncSession,
    connection: UserMailConnection,
) -> None:
    connection.status = "revoked"
    connection.encrypted_tokens = ""
    await db.flush()
