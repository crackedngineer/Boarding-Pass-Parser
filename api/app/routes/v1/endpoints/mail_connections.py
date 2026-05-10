from __future__ import annotations

import secrets
import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db_session
from app.core.settings import get_settings
from app.mail import registry as mail_registry
from app.mail.protonmail import ProtonMailProvider
from app.services import mail_token_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/mail")

# Simple in-process state store — replace with Redis TTL keys for multi-replica deployments
_pending_states: dict[str, dict] = {}


class ConnectResponse(BaseModel):
    auth_url: str
    state: str


class ProtonConnectRequest(BaseModel):
    provider_email: str
    imap_password: str


class ConnectionOut(BaseModel):
    id: str
    provider: str
    provider_email: str
    status: str
    scopes: list[str]
    connected_at: Any
    last_synced_at: Any


def _make_state(user_id: str, provider: str) -> str:
    token = secrets.token_urlsafe(32)
    _pending_states[token] = {"user_id": user_id, "provider": provider}
    return token


def _consume_state(state: str, provider: str) -> str:
    entry = _pending_states.pop(state, None)
    if entry is None:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state parameter.")
    if entry["provider"] != provider:
        raise HTTPException(status_code=400, detail="OAuth state provider mismatch.")
    return entry["user_id"]


def _connection_out(record) -> ConnectionOut:
    return ConnectionOut(
        id=str(record.id),
        provider=record.provider,
        provider_email=record.provider_email,
        status=record.status,
        scopes=record.scopes.split(",") if record.scopes else [],
        connected_at=record.connected_at,
        last_synced_at=record.last_synced_at,
    )


@router.get("/connections", response_model=list[ConnectionOut])
async def list_connections(
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> list[ConnectionOut]:
    records = await mail_token_service.list_connections(db, user_id)
    return [_connection_out(r) for r in records]


@router.post("/{provider}/connect", response_model=ConnectResponse)
async def connect_provider(
    provider: str,
    user_id: str = Depends(get_current_user),
    settings=Depends(get_settings),
) -> ConnectResponse:
    mail_provider = mail_registry.get(provider)
    redirect_uri = str(settings.google_redirect_uri or "")
    state = _make_state(user_id, provider)
    try:
        auth_url = mail_provider.get_oauth_url(state=state, redirect_uri=redirect_uri)
    except NotImplementedError:
        _pending_states.pop(state, None)
        raise HTTPException(
            status_code=400,
            detail=f"Provider '{provider}' does not use OAuth. Use the provider-specific connect endpoint.",
        )
    return ConnectResponse(auth_url=auth_url, state=state)


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db_session),
    settings=Depends(get_settings),
) -> dict:
    user_id = _consume_state(state, provider)
    mail_provider = mail_registry.get(provider)
    redirect_uri = str(settings.google_redirect_uri or "")

    try:
        creds = await mail_provider.exchange_code(code=code, redirect_uri=redirect_uri)
    except Exception as exc:
        logger.error("OAuth code exchange failed for %s: %s", provider, exc)
        raise HTTPException(status_code=400, detail=f"Failed to exchange OAuth code: {exc}")

    record = await mail_token_service.store_connection(db, user_id, provider, creds)
    await db.commit()
    logger.info("Mail connection stored: user=%s provider=%s email=%s", user_id, provider, creds.provider_email)
    return {"message": f"{provider} connected successfully", "connection_id": str(record.id)}


@router.post("/protonmail/connect", response_model=ConnectionOut)
async def connect_protonmail(
    request: ProtonConnectRequest,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> ConnectionOut:
    provider = mail_registry.get("protonmail")
    if not isinstance(provider, ProtonMailProvider):
        raise HTTPException(status_code=500, detail="ProtonMail provider not configured.")
    try:
        creds = await provider.build_credentials(request.provider_email, request.imap_password)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    record = await mail_token_service.store_connection(db, user_id, "protonmail", creds)
    await db.commit()
    return _connection_out(record)


@router.delete("/connections/{connection_id}")
async def disconnect(
    connection_id: str,
    user_id: str = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
) -> dict:
    record = await mail_token_service.get_connection_by_id(db, connection_id, user_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Connection not found.")
    await mail_token_service.revoke_connection(db, record)
    await db.commit()
    return {"message": "Mail connection revoked."}
