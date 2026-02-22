from typing import Any

from supabase import Client, ClientOptions, create_client
from supabase_auth.types import AuthResponse

from app.core.config import Settings


class SupabaseConfigurationError(RuntimeError):
    pass


class SupabaseOAuthStartError(RuntimeError):
    pass


def _ensure_supabase_configured(settings: Settings) -> None:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseConfigurationError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be configured"
        )


def create_supabase_client(settings: Settings) -> Client:
    _ensure_supabase_configured(settings)
    options = ClientOptions(
        flow_type="pkce",
        persist_session=False,
        auto_refresh_token=False,
    )
    return create_client(settings.supabase_url, settings.supabase_anon_key, options)


def serialize_auth_response(auth_response: AuthResponse) -> dict[str, Any]:
    session = auth_response.session
    user = auth_response.user or (session.user if session else None)
    return {
        "access_token": session.access_token if session else None,
        "refresh_token": session.refresh_token if session else None,
        "token_type": session.token_type if session else None,
        "expires_in": session.expires_in if session else None,
        "expires_at": session.expires_at if session else None,
        "user": user.model_dump() if user else None,
    }


def sign_in_with_password(
    settings: Settings, *, email: str, password: str
) -> dict[str, Any]:
    client = create_supabase_client(settings)
    auth_response = client.auth.sign_in_with_password(
        {
            "email": email,
            "password": password,
        }
    )
    return serialize_auth_response(auth_response)


def start_google_oauth(settings: Settings, *, state: str) -> tuple[str, str]:
    client = create_supabase_client(settings)
    oauth_response = client.auth.sign_in_with_oauth(
        {
            "provider": "google",
            "options": {
                "redirect_to": settings.supabase_google_redirect_url,
                "query_params": {
                    "state": state,
                },
            },
        }
    )

    # supabase-py stores the PKCE verifier in the auth client storage.
    storage_key = f"{client.auth._storage_key}-code-verifier"
    code_verifier = client.auth._storage.get_item(storage_key)
    if not code_verifier:
        raise SupabaseOAuthStartError("Unable to initialize Google OAuth PKCE flow")

    return oauth_response.url, code_verifier


def exchange_google_code(
    settings: Settings, *, auth_code: str, code_verifier: str
) -> dict[str, Any]:
    client = create_supabase_client(settings)
    auth_response = client.auth.exchange_code_for_session(
        {
            "auth_code": auth_code,
            "code_verifier": code_verifier,
        }
    )
    return serialize_auth_response(auth_response)
