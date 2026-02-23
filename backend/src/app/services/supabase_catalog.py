from __future__ import annotations

import re
import secrets
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from app.core.config import Settings

COLLECTIONS_TABLE = "home_collections"
PRODUCTS_TABLE = "catalog_products"
FEATURED_TABLE = "home_featured"
ADMINS_TABLE = "admin_users"

COLLECTION_SELECT = "id,slug,title,description,image_url,sort_order,is_active,created_at,updated_at"
PRODUCT_SELECT = (
    "id,slug,name,collection_id,price,description,size_guide,stock,composition_care,"
    "images,is_active,created_at,updated_at,collection:home_collections(id,slug,title)"
)
FEATURED_SELECT = "id,signature_product_id,best_seller_product_ids,updated_at"

_SLUG_PATTERN = re.compile(r"[^a-z0-9]+")
_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
}
_MAX_UPLOAD_BYTES = 10 * 1024 * 1024


class SupabaseCatalogConfigurationError(RuntimeError):
    pass


class SupabaseCatalogApiError(RuntimeError):
    def __init__(self, *, message: str, status: int) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


class SupabaseCatalogAuthError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class SupabaseCatalogAuthorizationError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class SupabaseCatalogRetryableError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def _ensure_supabase_configured(settings: Settings) -> None:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise SupabaseCatalogConfigurationError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be configured"
        )


def _base_headers(
    settings: Settings,
    *,
    access_token: str | None,
    content_type: str | None = None,
) -> dict[str, str]:
    token = access_token if access_token else settings.supabase_anon_key
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _extract_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        raw_text = response.text.strip()
        return raw_text if raw_text else f"Supabase request failed ({response.status_code})"

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
    access_token: str | None,
    params: dict[str, str] | None = None,
    json_payload: dict[str, Any] | list[dict[str, Any]] | None = None,
    prefer: str | None = None,
) -> Any:
    _ensure_supabase_configured(settings)

    url = f"{settings.supabase_url.rstrip('/')}/{path.lstrip('/')}"
    headers = _base_headers(
        settings,
        access_token=access_token,
        content_type="application/json" if json_payload is not None else None,
    )
    if prefer:
        headers["Prefer"] = prefer

    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.request(
                method=method,
                url=url,
                headers=headers,
                params=params,
                json=json_payload,
            )
    except httpx.TimeoutException as exc:
        raise SupabaseCatalogRetryableError("Supabase timeout") from exc
    except httpx.HTTPError as exc:
        raise SupabaseCatalogRetryableError("Supabase network error") from exc

    if response.status_code >= 400:
        if path.lstrip("/").startswith("auth/v1/user") and response.status_code in {401, 403}:
            raise SupabaseCatalogAuthError(_extract_error_message(response))
        raise SupabaseCatalogApiError(
            message=_extract_error_message(response),
            status=response.status_code,
        )

    if not response.content:
        return None

    try:
        return response.json()
    except ValueError:
        return None


def _request_upload(
    settings: Settings,
    *,
    access_token: str,
    path: str,
    content_type: str,
    body: bytes,
) -> Any:
    _ensure_supabase_configured(settings)

    headers = _base_headers(settings, access_token=access_token, content_type=content_type)
    headers["x-upsert"] = "false"

    url = f"{settings.supabase_url.rstrip('/')}/{path.lstrip('/')}"

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                url=url,
                headers=headers,
                content=body,
            )
    except httpx.TimeoutException as exc:
        raise SupabaseCatalogRetryableError("Supabase upload timeout") from exc
    except httpx.HTTPError as exc:
        raise SupabaseCatalogRetryableError("Supabase upload network error") from exc

    if response.status_code >= 400:
        raise SupabaseCatalogApiError(
            message=_extract_error_message(response),
            status=response.status_code,
        )

    if not response.content:
        return None

    try:
        return response.json()
    except ValueError:
        return None


def _normalize_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = value.strip()
    return cleaned


def _normalize_text_array(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    normalized: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        cleaned = item.strip()
        if cleaned:
            normalized.append(cleaned)

    return normalized


def _normalize_price(value: Any) -> float:
    try:
        parsed = float(value) if value is not None else 0.0
    except (TypeError, ValueError):
        parsed = 0.0
    if parsed < 0:
        parsed = 0.0
    return round(parsed, 2)


def _slugify(raw_value: str) -> str:
    normalized = raw_value.strip().lower()
    normalized = normalized.replace("'", " ")
    normalized = _SLUG_PATTERN.sub("-", normalized)
    normalized = normalized.strip("-")
    return normalized[:96]


def _normalize_collection(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": row.get("id"),
        "slug": _normalize_text(row.get("slug")),
        "title": _normalize_text(row.get("title")),
        "description": _normalize_text(row.get("description")),
        "image_url": _normalize_text(row.get("image_url")),
        "sort_order": row.get("sort_order") if isinstance(row.get("sort_order"), int) else 0,
        "is_active": bool(row.get("is_active", True)),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def _normalize_product(row: dict[str, Any]) -> dict[str, Any]:
    collection_payload = row.get("collection")
    collection = collection_payload if isinstance(collection_payload, dict) else {}

    images = _normalize_text_array(row.get("images"))

    return {
        "id": row.get("id"),
        "slug": _normalize_text(row.get("slug")),
        "name": _normalize_text(row.get("name")),
        "collection_id": row.get("collection_id"),
        "collection": {
            "id": collection.get("id"),
            "slug": _normalize_text(collection.get("slug")),
            "title": _normalize_text(collection.get("title")),
        },
        "price": _normalize_price(row.get("price")),
        "description": _normalize_text(row.get("description")),
        "size_guide": _normalize_text_array(row.get("size_guide")),
        "stock": row.get("stock") if isinstance(row.get("stock"), int) else 0,
        "composition_care": _normalize_text_array(row.get("composition_care")),
        "images": images,
        "is_active": bool(row.get("is_active", True)),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
    }


def _normalize_featured(row: dict[str, Any] | None) -> dict[str, Any]:
    if not isinstance(row, dict):
        return {
            "signature_product_id": None,
            "best_seller_product_ids": [],
            "updated_at": None,
        }

    raw_best_ids = row.get("best_seller_product_ids")
    best_ids: list[str] = []
    if isinstance(raw_best_ids, list):
        for product_id in raw_best_ids:
            if isinstance(product_id, str) and product_id.strip():
                best_ids.append(product_id.strip())

    signature_product_id = row.get("signature_product_id")
    if not isinstance(signature_product_id, str) or not signature_product_id.strip():
        signature_product_id = None

    return {
        "signature_product_id": signature_product_id,
        "best_seller_product_ids": list(dict.fromkeys(best_ids)),
        "updated_at": row.get("updated_at"),
    }


def _fetch_authenticated_user(settings: Settings, *, access_token: str) -> dict[str, Any]:
    payload = _request_json(
        settings,
        method="GET",
        path="/auth/v1/user",
        access_token=access_token,
    )
    if not isinstance(payload, dict):
        raise SupabaseCatalogApiError(message="Invalid Supabase user payload", status=502)
    user_id = payload.get("id")
    if not isinstance(user_id, str) or not user_id.strip():
        raise SupabaseCatalogApiError(message="Missing Supabase user id", status=502)
    return payload


def _ensure_admin_user(settings: Settings, *, access_token: str) -> dict[str, Any]:
    user = _fetch_authenticated_user(settings, access_token=access_token)
    user_id = user["id"]

    rows = _request_json(
        settings,
        method="GET",
        path=f"/rest/v1/{ADMINS_TABLE}",
        access_token=access_token,
        params={
            "select": "user_id",
            "user_id": f"eq.{user_id}",
            "limit": "1",
        },
    )

    if not isinstance(rows, list) or not rows:
        raise SupabaseCatalogAuthorizationError("Admin access required")

    return user


def _list_collections(
    settings: Settings,
    *,
    access_token: str | None,
    include_inactive: bool,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {
        "select": COLLECTION_SELECT,
        "order": "sort_order.asc,created_at.asc",
    }
    if not include_inactive:
        params["is_active"] = "eq.true"

    rows = _request_json(
        settings,
        method="GET",
        path=f"/rest/v1/{COLLECTIONS_TABLE}",
        access_token=access_token,
        params=params,
    )

    if not isinstance(rows, list):
        return []

    normalized: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict):
            normalized.append(_normalize_collection(row))
    return normalized


def _list_products(
    settings: Settings,
    *,
    access_token: str | None,
    include_inactive: bool,
) -> list[dict[str, Any]]:
    params: dict[str, str] = {
        "select": PRODUCT_SELECT,
        "order": "created_at.desc",
    }
    if not include_inactive:
        params["is_active"] = "eq.true"

    rows = _request_json(
        settings,
        method="GET",
        path=f"/rest/v1/{PRODUCTS_TABLE}",
        access_token=access_token,
        params=params,
    )

    if not isinstance(rows, list):
        return []

    normalized: list[dict[str, Any]] = []
    for row in rows:
        if isinstance(row, dict):
            normalized.append(_normalize_product(row))
    return normalized


def _get_featured(
    settings: Settings,
    *,
    access_token: str | None,
) -> dict[str, Any]:
    rows = _request_json(
        settings,
        method="GET",
        path=f"/rest/v1/{FEATURED_TABLE}",
        access_token=access_token,
        params={
            "select": FEATURED_SELECT,
            "id": "eq.1",
            "limit": "1",
        },
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        return _normalize_featured(None)

    return _normalize_featured(rows[0])


def _build_unique_product_slug(
    settings: Settings,
    *,
    access_token: str,
    raw_slug: str,
    exclude_product_id: str | None = None,
) -> str:
    base_slug = _slugify(raw_slug)
    if not base_slug:
        raise SupabaseCatalogApiError(message="Slug produit invalide", status=422)

    for attempt in range(40):
        candidate = base_slug if attempt == 0 else f"{base_slug}-{attempt + 1}"
        params = {
            "select": "id",
            "slug": f"eq.{candidate}",
            "limit": "1",
        }
        if exclude_product_id:
            params["id"] = f"neq.{exclude_product_id}"

        rows = _request_json(
            settings,
            method="GET",
            path=f"/rest/v1/{PRODUCTS_TABLE}",
            access_token=access_token,
            params=params,
        )

        if not isinstance(rows, list) or not rows:
            return candidate

    raise SupabaseCatalogApiError(
        message="Impossible de generer un slug unique",
        status=409,
    )


def _fetch_product_row(
    settings: Settings,
    *,
    access_token: str,
    product_id: str,
) -> dict[str, Any]:
    rows = _request_json(
        settings,
        method="GET",
        path=f"/rest/v1/{PRODUCTS_TABLE}",
        access_token=access_token,
        params={
            "select": PRODUCT_SELECT,
            "id": f"eq.{product_id}",
            "limit": "1",
        },
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Produit introuvable", status=404)

    return rows[0]


def _fetch_collection_row(
    settings: Settings,
    *,
    access_token: str,
    collection_id: str,
) -> dict[str, Any]:
    rows = _request_json(
        settings,
        method="GET",
        path=f"/rest/v1/{COLLECTIONS_TABLE}",
        access_token=access_token,
        params={
            "select": COLLECTION_SELECT,
            "id": f"eq.{collection_id}",
            "limit": "1",
        },
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Collection introuvable", status=404)

    return rows[0]


def _dedupe_text_array(values: list[str]) -> list[str]:
    deduped: list[str] = []
    for value in values:
        cleaned = value.strip()
        if cleaned and cleaned not in deduped:
            deduped.append(cleaned)
    return deduped


def get_public_catalog(settings: Settings) -> dict[str, Any]:
    collections = _list_collections(settings, access_token=None, include_inactive=False)
    products = _list_products(settings, access_token=None, include_inactive=False)
    featured = _get_featured(settings, access_token=None)

    available_product_ids = {
        product["id"] for product in products if isinstance(product.get("id"), str)
    }

    signature_id = featured["signature_product_id"]
    if signature_id not in available_product_ids:
        signature_id = None

    best_seller_ids = [
        product_id
        for product_id in featured["best_seller_product_ids"]
        if product_id in available_product_ids
    ]

    return {
        "collections": collections,
        "products": products,
        "featured": {
            "signature_product_id": signature_id,
            "best_seller_product_ids": best_seller_ids,
            "updated_at": featured["updated_at"],
        },
    }


def get_admin_catalog(settings: Settings, *, access_token: str) -> dict[str, Any]:
    _ensure_admin_user(settings, access_token=access_token)

    collections = _list_collections(settings, access_token=access_token, include_inactive=True)
    products = _list_products(settings, access_token=access_token, include_inactive=True)
    featured = _get_featured(settings, access_token=access_token)

    return {
        "collections": collections,
        "products": products,
        "featured": featured,
    }


def create_collection(
    settings: Settings,
    *,
    access_token: str,
    title: str,
    description: str,
    image_url: str,
    sort_order: int,
    is_active: bool,
    slug: str | None,
) -> dict[str, Any]:
    _ensure_admin_user(settings, access_token=access_token)

    raw_slug = slug if isinstance(slug, str) and slug.strip() else title
    normalized_slug = _slugify(raw_slug)
    if not normalized_slug:
        raise SupabaseCatalogApiError(message="Slug collection invalide", status=422)

    rows = _request_json(
        settings,
        method="POST",
        path=f"/rest/v1/{COLLECTIONS_TABLE}",
        access_token=access_token,
        params={"select": COLLECTION_SELECT},
        prefer="return=representation",
        json_payload={
            "slug": normalized_slug,
            "title": title.strip(),
            "description": description.strip(),
            "image_url": image_url.strip(),
            "sort_order": sort_order,
            "is_active": is_active,
        },
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Creation collection invalide", status=502)

    return _normalize_collection(rows[0])


def update_collection(
    settings: Settings,
    *,
    access_token: str,
    collection_id: str,
    title: str | None,
    description: str | None,
    image_url: str | None,
    sort_order: int | None,
    is_active: bool | None,
    slug: str | None,
) -> dict[str, Any]:
    _ensure_admin_user(settings, access_token=access_token)
    current = _fetch_collection_row(settings, access_token=access_token, collection_id=collection_id)

    payload: dict[str, Any] = {
        "title": title.strip() if isinstance(title, str) and title.strip() else current.get("title"),
        "description": (
            description.strip()
            if isinstance(description, str) and description.strip()
            else current.get("description")
        ),
        "image_url": (
            image_url.strip() if isinstance(image_url, str) and image_url.strip() else current.get("image_url")
        ),
        "sort_order": sort_order if isinstance(sort_order, int) else current.get("sort_order", 0),
        "is_active": is_active if isinstance(is_active, bool) else bool(current.get("is_active", True)),
        "slug": current.get("slug"),
    }

    if isinstance(slug, str) and slug.strip():
        payload["slug"] = _slugify(slug)
        if not payload["slug"]:
            raise SupabaseCatalogApiError(message="Slug collection invalide", status=422)

    rows = _request_json(
        settings,
        method="PATCH",
        path=f"/rest/v1/{COLLECTIONS_TABLE}",
        access_token=access_token,
        params={
            "select": COLLECTION_SELECT,
            "id": f"eq.{collection_id}",
        },
        prefer="return=representation",
        json_payload=payload,
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Mise a jour collection invalide", status=502)

    return _normalize_collection(rows[0])


def create_product(
    settings: Settings,
    *,
    access_token: str,
    name: str,
    collection_id: str,
    price: float,
    description: str,
    size_guide: list[str],
    stock: int,
    composition_care: list[str],
    images: list[str],
    is_active: bool,
    slug: str | None,
) -> dict[str, Any]:
    _ensure_admin_user(settings, access_token=access_token)

    if not isinstance(collection_id, str) or not collection_id.strip():
        raise SupabaseCatalogApiError(message="Collection invalide", status=422)

    cleaned_images = _dedupe_text_array(images)
    if not cleaned_images:
        raise SupabaseCatalogApiError(message="Au moins une image est requise", status=422)

    unique_slug = _build_unique_product_slug(
        settings,
        access_token=access_token,
        raw_slug=slug if isinstance(slug, str) and slug.strip() else name,
    )

    rows = _request_json(
        settings,
        method="POST",
        path=f"/rest/v1/{PRODUCTS_TABLE}",
        access_token=access_token,
        params={"select": PRODUCT_SELECT},
        prefer="return=representation",
        json_payload={
            "slug": unique_slug,
            "name": name.strip(),
            "collection_id": collection_id.strip(),
            "price": round(max(price, 0), 2),
            "description": description.strip(),
            "size_guide": _dedupe_text_array(size_guide),
            "stock": max(stock, 0),
            "composition_care": _dedupe_text_array(composition_care),
            "images": cleaned_images,
            "is_active": is_active,
        },
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Creation produit invalide", status=502)

    return _normalize_product(rows[0])


def update_product(
    settings: Settings,
    *,
    access_token: str,
    product_id: str,
    name: str | None,
    collection_id: str | None,
    price: float | None,
    description: str | None,
    size_guide: list[str] | None,
    stock: int | None,
    composition_care: list[str] | None,
    images: list[str] | None,
    is_active: bool | None,
    slug: str | None,
) -> dict[str, Any]:
    _ensure_admin_user(settings, access_token=access_token)
    current = _fetch_product_row(settings, access_token=access_token, product_id=product_id)

    next_images = _normalize_text_array(current.get("images"))
    if isinstance(images, list):
        next_images = _dedupe_text_array(images)
    if not next_images:
        raise SupabaseCatalogApiError(message="Au moins une image est requise", status=422)

    next_slug = _normalize_text(current.get("slug"))
    if isinstance(slug, str) and slug.strip():
        next_slug = _build_unique_product_slug(
            settings,
            access_token=access_token,
            raw_slug=slug,
            exclude_product_id=product_id,
        )

    payload = {
        "slug": next_slug,
        "name": name.strip() if isinstance(name, str) and name.strip() else current.get("name"),
        "collection_id": (
            collection_id.strip()
            if isinstance(collection_id, str) and collection_id.strip()
            else current.get("collection_id")
        ),
        "price": round(max(price, 0), 2)
        if isinstance(price, (int, float))
        else _normalize_price(current.get("price")),
        "description": (
            description.strip()
            if isinstance(description, str)
            else _normalize_text(current.get("description"))
        ),
        "size_guide": (
            _dedupe_text_array(size_guide)
            if isinstance(size_guide, list)
            else _normalize_text_array(current.get("size_guide"))
        ),
        "stock": max(stock, 0)
        if isinstance(stock, int)
        else current.get("stock") if isinstance(current.get("stock"), int) else 0,
        "composition_care": (
            _dedupe_text_array(composition_care)
            if isinstance(composition_care, list)
            else _normalize_text_array(current.get("composition_care"))
        ),
        "images": next_images,
        "is_active": is_active if isinstance(is_active, bool) else bool(current.get("is_active", True)),
    }

    rows = _request_json(
        settings,
        method="PATCH",
        path=f"/rest/v1/{PRODUCTS_TABLE}",
        access_token=access_token,
        params={
            "select": PRODUCT_SELECT,
            "id": f"eq.{product_id}",
        },
        prefer="return=representation",
        json_payload=payload,
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Mise a jour produit invalide", status=502)

    return _normalize_product(rows[0])


def update_featured(
    settings: Settings,
    *,
    access_token: str,
    signature_product_id: str | None,
    best_seller_product_ids: list[str],
) -> dict[str, Any]:
    _ensure_admin_user(settings, access_token=access_token)

    available_products = _list_products(
        settings,
        access_token=access_token,
        include_inactive=False,
    )
    available_ids = {
        product["id"] for product in available_products if isinstance(product.get("id"), str)
    }

    normalized_signature = (
        signature_product_id.strip()
        if isinstance(signature_product_id, str) and signature_product_id.strip()
        else None
    )

    if normalized_signature and normalized_signature not in available_ids:
        raise SupabaseCatalogApiError(message="Produit signature introuvable", status=422)

    normalized_best_ids: list[str] = []
    for product_id in best_seller_product_ids:
        if not isinstance(product_id, str) or not product_id.strip():
            continue
        cleaned = product_id.strip()
        if cleaned in available_ids and cleaned not in normalized_best_ids:
            normalized_best_ids.append(cleaned)

    rows = _request_json(
        settings,
        method="POST",
        path=f"/rest/v1/{FEATURED_TABLE}",
        access_token=access_token,
        params={
            "on_conflict": "id",
            "select": FEATURED_SELECT,
        },
        prefer="resolution=merge-duplicates,return=representation",
        json_payload={
            "id": 1,
            "signature_product_id": normalized_signature,
            "best_seller_product_ids": normalized_best_ids,
        },
    )

    if not isinstance(rows, list) or not rows or not isinstance(rows[0], dict):
        raise SupabaseCatalogApiError(message="Mise a jour featured invalide", status=502)

    return _normalize_featured(rows[0])


def upload_admin_image(
    settings: Settings,
    *,
    access_token: str,
    filename: str,
    content_type: str | None,
    content: bytes,
    scope: str,
) -> dict[str, str]:
    _ensure_admin_user(settings, access_token=access_token)

    if len(content) == 0:
        raise SupabaseCatalogApiError(message="Fichier vide", status=422)
    if len(content) > _MAX_UPLOAD_BYTES:
        raise SupabaseCatalogApiError(message="Fichier trop volumineux", status=413)

    normalized_content_type = content_type.strip().lower() if isinstance(content_type, str) else ""
    if normalized_content_type not in _ALLOWED_IMAGE_TYPES:
        raise SupabaseCatalogApiError(message="Type de fichier non supporte", status=415)

    requested_scope = scope.strip().lower() if isinstance(scope, str) else ""
    safe_scope = "collections" if requested_scope == "collections" else "products"

    extension = Path(filename or "").suffix.lower()
    if extension not in _ALLOWED_IMAGE_TYPES.values():
        extension = _ALLOWED_IMAGE_TYPES[normalized_content_type]

    timestamp = datetime.now(timezone.utc).strftime("%Y/%m")
    random_part = secrets.token_hex(12)
    storage_path = f"{safe_scope}/{timestamp}/{random_part}{extension}"

    _request_upload(
        settings,
        access_token=access_token,
        path=f"/storage/v1/object/{settings.supabase_storage_bucket}/{storage_path}",
        content_type=normalized_content_type,
        body=content,
    )

    public_url = (
        f"{settings.supabase_url.rstrip('/')}/storage/v1/object/public/"
        f"{settings.supabase_storage_bucket}/{storage_path}"
    )

    return {
        "path": storage_path,
        "image_url": public_url,
    }
