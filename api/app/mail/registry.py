from __future__ import annotations

from fastapi import HTTPException
from app.mail.base import MailProvider

_registry: dict[str, MailProvider] = {}


def register(provider: MailProvider) -> None:
    _registry[provider.provider_name] = provider


def get(name: str) -> MailProvider:
    provider = _registry.get(name)
    if provider is None:
        supported = ", ".join(_registry.keys()) or "none configured"
        raise HTTPException(
            status_code=400,
            detail=f"Mail provider '{name}' is not supported. Supported: {supported}",
        )
    return provider


def all_providers() -> list[MailProvider]:
    return list(_registry.values())
