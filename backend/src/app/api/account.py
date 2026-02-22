import logging
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.supabase_account import (
    SupabaseAccountApiError,
    SupabaseAccountAuthError,
    SupabaseAccountConfigurationError,
    SupabaseAccountRetryableError,
    get_account_profile,
    list_account_orders,
    upsert_account_profile,
)

router = APIRouter(prefix="/account", tags=["account"])
logger = logging.getLogger(__name__)


class AccountProfileUpsertRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=40)
    address: str | None = Field(default=None, max_length=320)


def _normalize_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned if cleaned else None


def _extract_access_token(authorization: str | None = Header(default=None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid bearer token")
    return token.strip()


def _raise_account_error(exc: Exception) -> None:
    if isinstance(exc, SupabaseAccountConfigurationError):
        raise HTTPException(status_code=500, detail=str(exc))
    if isinstance(exc, SupabaseAccountAuthError):
        raise HTTPException(status_code=401, detail=exc.message)
    if isinstance(exc, SupabaseAccountRetryableError):
        raise HTTPException(status_code=503, detail=exc.message)
    if isinstance(exc, SupabaseAccountApiError):
        status_code = exc.status if 400 <= exc.status < 600 else 502
        raise HTTPException(status_code=status_code, detail=exc.message)
    raise HTTPException(status_code=500, detail="Unexpected account error")


def _log_account_error(context: str, exc: Exception) -> None:
    if isinstance(exc, SupabaseAccountAuthError):
        logger.warning("%s failed (auth): %s", context, exc.message)
        return
    if isinstance(exc, SupabaseAccountRetryableError):
        logger.warning("%s failed (retryable): %s", context, exc.message)
        return
    if isinstance(exc, SupabaseAccountApiError):
        logger.warning("%s failed (status=%s): %s", context, exc.status, exc.message)
        return
    logger.warning("%s failed (unexpected): %s", context, str(exc))


@router.get("/profile")
def account_profile_get(
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return get_account_profile(settings, access_token=access_token)
    except Exception as exc:
        _log_account_error("Account profile read", exc)
        _raise_account_error(exc)


@router.put("/profile")
def account_profile_upsert(
    payload: AccountProfileUpsertRequest,
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return upsert_account_profile(
            settings,
            access_token=access_token,
            full_name=_normalize_optional(payload.full_name),
            phone=_normalize_optional(payload.phone),
            address=_normalize_optional(payload.address),
        )
    except Exception as exc:
        _log_account_error("Account profile write", exc)
        _raise_account_error(exc)


@router.get("/orders")
def account_orders_list(
    access_token: str = Depends(_extract_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, list[dict[str, Any]]]:
    try:
        orders = list_account_orders(settings, access_token=access_token)
    except Exception as exc:
        _log_account_error("Account orders read", exc)
        _raise_account_error(exc)

    return {"orders": orders}
