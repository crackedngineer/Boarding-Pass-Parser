import logging
from typing import Optional
from supabase import Client, create_client
from supabase_auth import CodeExchangeParams
from app.core.exceptions import AuthenticationException
from redis.asyncio import Redis
from supabase_auth import SignInWithOAuthCredentials, SignInWithOAuthCredentialsOptions
from supabase_auth.types import AuthResponse

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, supabase_client: Client, redis_client: Redis):
        self.supabase_client = supabase_client
        self.redis_client = redis_client

    async def authenticate_with_google(self) -> dict:
        from app.core.settings import get_settings

        settings = get_settings()
        options: SignInWithOAuthCredentialsOptions = {
            "scopes": "openid email profile https://www.googleapis.com/auth/gmail.readonly",
            "query_params": {
                "access_type": "offline",
                "prompt": "consent",
                "include_granted_scopes": "true",
            },
        }
        if settings.google_redirect_uri:
            options["redirect_to"] = settings.google_redirect_uri
        result = self.supabase_client.auth.sign_in_with_oauth(
            SignInWithOAuthCredentials(provider="google", options=options)
        )
        if not result:
            raise AuthenticationException("OAuth authentication failed")

        # gotrue stores the PKCE code_verifier in _storage after sign_in_with_oauth.
        # We surface it so the frontend can hold it across the OAuth redirect and
        # send it back to /auth/callback for the code exchange.
        code_verifier: Optional[str] = None
        try:
            storage_key: str = self.supabase_client.auth._storage_key  # type: ignore[attr-defined]
            storage = self.supabase_client.auth._storage  # type: ignore[attr-defined]
            code_verifier = storage.get_item(f"{storage_key}-code-verifier")
        except Exception:
            logger.debug("Could not extract PKCE code_verifier from gotrue storage")

        return {
            "url": result.url,
            "code_verifier": code_verifier,
        }

    async def get_current_user(self, access_token: str) -> dict:
        resp = self.supabase_client.auth.get_user(access_token)
        if not resp or not resp.user:
            raise AuthenticationException("Invalid or expired token")
        return {
            "id": resp.user.id,
            "email": resp.user.email,
            "user_metadata": resp.user.user_metadata,
            "app_metadata": resp.user.app_metadata,
        }

    async def refresh_token(self, refresh_token: str) -> AuthResponse:
        try:
            result = self.supabase_client.auth.refresh_session(refresh_token)
        except Exception as e:
            raise AuthenticationException(f"Token refresh failed: {e}") from e
        if not result or not result.session:
            raise AuthenticationException("Token refresh failed")
        return result

    async def sign_out(self) -> None:
        self.supabase_client.auth.sign_out()

    def exchange_code_for_session(
        self, code: str, redirect_url: str, code_verifier: str
    ) -> AuthResponse:
        result = self.supabase_client.auth.exchange_code_for_session(
            CodeExchangeParams(
                **{
                    "auth_code": code,
                    "redirect_to": redirect_url,
                    "code_verifier": code_verifier,
                }
            )
        )
        if not result or not result.session:
            raise AuthenticationException("Code exchange failed")
        return result

    def get_google_tokens(
        self, supabase_url: str, service_role_key: str, user_id: str
    ) -> tuple[str, Optional[str]]:
        """Extract Google refresh + access tokens from Supabase identity data via admin API."""
        admin = create_client(supabase_url, service_role_key)
        user_data = admin.auth.admin.get_user_by_id(user_id)
        if not (user_data and user_data.user and user_data.user.identities):
            raise AuthenticationException("No identity data found for user")
        for identity in user_data.user.identities:
            if identity.provider == "google":
                data = identity.identity_data or {}
                refresh = data.get("provider_refresh_token") or data.get(
                    "refresh_token"
                )
                access = data.get("provider_token") or data.get("access_token")
                if not refresh:
                    raise AuthenticationException(
                        "No Google refresh token available. Re-authenticate with prompt=consent."
                    )
                return refresh, access
        raise AuthenticationException("No Google identity found for user")
