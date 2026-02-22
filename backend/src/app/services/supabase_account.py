from __future__ import annotations

from typing import Any

import httpx

from app.core.config import Settings


class SupabaseAccountConfigurationError(RuntimeError):
    pass


class SupabaseAccountApiError(RuntimeError):
    def __init__(self, *, message: str, status: int) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


class SupabaseAccountAuthError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class SupabaseAccountRetryableError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _ensure_supabase_configured(settings: Settings) -> None:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseAccountConfigurationError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be configured"
        )


def _base_headers(settings: Settings, *, access_token: str) -> dict[str, str]:
    return {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }


def _extract_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return f"Supabase request failed ({response.status_code})"

    if isinstance(payload, dict):
        message = payload.get("message") or payload.get("error") or payload.get("details")
        if isinstance(message, str) and message.strip():
            return message.strip()

    return f"Supabase request failed ({response.status_code})"


def _request_json(
    settings: Settings,
    *,
    method: str,
    path: str,
    access_token: str,
    params: dict[str, str] | None = None,
    json_payload: dict[str, Any] | None = None,
    prefer: str | None = None,
) -> Any:
    _ensure_supabase_configured(settings)
    url = f"{settings.supabase_url.rstrip('/')}/{path.lstrip('/')}"
    headers = _base_headers(settings, access_token=access_token)
    if prefer:
        headers["Prefer"] = prefer

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_payload,
            )
    except httpx.TimeoutException as exc:
        raise SupabaseAccountRetryableError("Supabase timeout") from exc
    except httpx.HTTPError as exc:
        raise SupabaseAccountRetryableError("Supabase network error") from exc

    if response.status_code >= 400:
        if path.lstrip("/").startswith("auth/v1/user") and response.status_code in {401, 403}:
            raise SupabaseAccountAuthError(_extract_error_message(response))
        raise SupabaseAccountApiError(
            message=_extract_error_message(response),
            status=response.status_code,
        )

    if not response.content:
        return None
    return response.json()


def _fetch_authenticated_user(settings: Settings, *, access_token: str) -> dict[str, Any]:
    payload = _request_json(
        settings,
        method="GET",
        path="/auth/v1/user",
        access_token=access_token,
    )
    if not isinstance(payload, dict):
        raise SupabaseAccountApiError(message="Invalid Supabase user payload", status=502)
    if not isinstance(payload.get("id"), str) or not payload["id"].strip():
        raise SupabaseAccountApiError(message="Missing Supabase user id", status=502)
    return payload


def get_account_profile(settings: Settings, *, access_token: str) -> dict[str, Any]:
    user = _fetch_authenticated_user(settings, access_token=access_token)
    user_id = user["id"]

    rows = _request_json(
        settings,
        method="GET",
        path="/rest/v1/customer_profiles",
        access_token=access_token,
        params={
            "select": "full_name,phone,address,created_at,updated_at",
            "user_id": f"eq.{user_id}",
            "limit": "1",
        },
    )
    if not isinstance(rows, list) or not rows:
        return {
            "email": user.get("email"),
            "full_name": None,
            "phone": None,
            "address": None,
            "created_at": None,
            "updated_at": None,
        }

    row = rows[0] if isinstance(rows[0], dict) else {}
    return {
        "email": user.get("email"),
        "full_name": row.get("full_name"),
        "phone": row.get("phone"),
        "address": row.get("address"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def upsert_account_profile(
    settings: Settings,
    *,
    access_token: str,
    full_name: str | None,
    phone: str | None,
    address: str | None,
) -> dict[str, Any]:
    user = _fetch_authenticated_user(settings, access_token=access_token)
    user_id = user["id"]

    rows = _request_json(
        settings,
        method="POST",
        path="/rest/v1/customer_profiles",
        access_token=access_token,
        params={
            "on_conflict": "user_id",
            "select": "full_name,phone,address,created_at,updated_at",
        },
        prefer="resolution=merge-duplicates,return=representation",
        json_payload={
            "user_id": user_id,
            "full_name": full_name,
            "phone": phone,
            "address": address,
        },
    )
    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseAccountApiError(message="Invalid profile write payload", status=502)

    row = rows[0]
    return {
        "email": user.get("email"),
        "full_name": row.get("full_name"),
        "phone": row.get("phone"),
        "address": row.get("address"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def list_account_orders(settings: Settings, *, access_token: str) -> list[dict[str, Any]]:
    user = _fetch_authenticated_user(settings, access_token=access_token)
    user_id = user["id"]

    rows = _request_json(
        settings,
        method="GET",
        path="/rest/v1/customer_orders",
        access_token=access_token,
        params={
            "select": "id,order_number,status,total_amount,currency,items_count,ordered_at,created_at",
            "user_id": f"eq.{user_id}",
            "order": "ordered_at.desc",
        },
    )
    if not isinstance(rows, list):
        return []

    normalized: list[dict[str, Any]] = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        normalized.append(
            {
                "id": row.get("id"),
                "order_number": row.get("order_number"),
                "status": row.get("status"),
                "total_amount": row.get("total_amount"),
                "currency": row.get("currency"),
                "items_count": row.get("items_count"),
                "ordered_at": row.get("ordered_at"),
                "created_at": row.get("created_at"),
            }
        )
    return normalized
