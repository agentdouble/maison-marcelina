import os
import re
from dataclasses import dataclass

_CURRENCY_PATTERN = re.compile(r"^[a-zA-Z]{3}$")


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_env: str
    backend_host: str
    backend_port: int
    frontend_host: str
    frontend_port: int
    cors_origins: list[str]
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_storage_bucket: str
    supabase_google_redirect_url: str
    auth_cookie_secure: bool
    stripe_secret_key: str
    stripe_currency: str
    stripe_webhook_secret: str


def _parse_origins(raw: str) -> list[str]:
    origins = [value.strip() for value in raw.split(",") if value.strip()]
    # Keep order stable while removing duplicates.
    return list(dict.fromkeys(origins))


def _parse_bool(raw: str | None, *, default: bool) -> bool:
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _parse_currency(raw: str | None, *, default: str) -> str:
    if raw is None:
        return default

    cleaned = raw.strip().lower()
    if not cleaned:
        return default
    if not _CURRENCY_PATTERN.match(cleaned):
        return default
    return cleaned


def get_settings() -> Settings:
    frontend_host = os.getenv("FRONTEND_HOST", "127.0.0.1")
    frontend_port = int(os.getenv("FRONTEND_PORT", "3000"))
    backend_port = int(os.getenv("BACKEND_PORT", "8000"))

    raw_origins = os.getenv("CORS_ORIGINS", "")
    cors_origins = _parse_origins(raw_origins)
    if not cors_origins:
        cors_origins = [
            f"http://{frontend_host}:{frontend_port}",
            f"http://localhost:{frontend_port}",
            f"http://127.0.0.1:{frontend_port}",
        ]

    return Settings(
        app_name=os.getenv("APP_NAME", "app-template"),
        app_env=os.getenv("APP_ENV", "development"),
        backend_host=os.getenv("BACKEND_HOST", "0.0.0.0"),
        backend_port=backend_port,
        frontend_host=frontend_host,
        frontend_port=frontend_port,
        cors_origins=cors_origins,
        supabase_url=os.getenv("SUPABASE_URL", "").strip(),
        supabase_anon_key=os.getenv("SUPABASE_ANON_KEY", "").strip(),
        supabase_service_role_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip(),
        supabase_storage_bucket=os.getenv(
            "SUPABASE_STORAGE_BUCKET", "maison-marcelina"
        ).strip(),
        supabase_google_redirect_url=os.getenv(
            "SUPABASE_GOOGLE_REDIRECT_URL",
            f"http://localhost:{backend_port}/auth/google/callback",
        ).strip(),
        auth_cookie_secure=_parse_bool(
            os.getenv("AUTH_COOKIE_SECURE"),
            default=os.getenv("APP_ENV", "development") == "production",
        ),
        stripe_secret_key=os.getenv("STRIPE_SECRET_KEY", "").strip(),
        stripe_currency=_parse_currency(
            os.getenv("STRIPE_CURRENCY"),
            default="eur",
        ),
        stripe_webhook_secret=os.getenv("STRIPE_WEBHOOK_SECRET", "").strip(),
    )
