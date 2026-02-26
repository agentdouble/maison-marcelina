from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

import httpx
import stripe
from stripe import (
    APIConnectionError,
    APIError,
    AuthenticationError,
    InvalidRequestError,
    RateLimitError,
    SignatureVerificationError,
    StripeError,
)

from app.core.config import Settings
from app.services.supabase_catalog import (
    SupabaseCatalogApiError,
    SupabaseCatalogConfigurationError,
    SupabaseCatalogRetryableError,
    get_public_catalog,
)

CUSTOMER_ORDERS_TABLE = "customer_orders"
_UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
_ORDER_NUMBER_PATTERN = re.compile(r"[^A-Z0-9]+")


class StripeCheckoutConfigurationError(RuntimeError):
    pass


class StripeCheckoutValidationError(RuntimeError):
    def __init__(self, message: str, *, status: int = 422) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


class StripeCheckoutApiError(RuntimeError):
    def __init__(self, message: str, *, status: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


class StripeCheckoutRetryableError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class StripeCheckoutAuthError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class StripeWebhookSignatureError(RuntimeError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


@dataclass(frozen=True)
class CheckoutCartItem:
    product_id: str
    quantity: int
    size: str | None = None


@dataclass(frozen=True)
class CheckoutCustomerReference:
    user_id: str
    email: str | None = None


@dataclass(frozen=True)
class ConfirmedOrderData:
    order_number: str
    user_id: str
    status: str
    total_amount: float
    currency: str
    items_count: int
    ordered_at: str


def _extract_stripe_message(exc: StripeError) -> str:
    user_message = getattr(exc, "user_message", None)
    if isinstance(user_message, str) and user_message.strip():
        return user_message.strip()
    message = str(exc).strip()
    return message if message else "Stripe request failed"


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


def _normalize_text(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    return value.strip()


def _normalize_size(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned if cleaned else None


def _normalize_optional_email(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned if cleaned else None


def _is_valid_uuid(value: str) -> bool:
    return bool(_UUID_PATTERN.match(value.strip()))


def _to_minor_units(raw_price: Any) -> int:
    try:
        parsed = Decimal(str(raw_price))
    except (InvalidOperation, TypeError, ValueError):
        raise StripeCheckoutValidationError("Prix produit invalide", status=502)

    normalized = parsed.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    unit_amount = int(normalized * 100)
    if unit_amount <= 0:
        raise StripeCheckoutValidationError("Prix produit invalide", status=502)
    return unit_amount


def _ensure_supabase_service_configured(settings: Settings) -> None:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise StripeCheckoutConfigurationError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured"
        )


def _service_headers(settings: Settings) -> dict[str, str]:
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Accept": "application/json",
    }


def _service_request_json(
    settings: Settings,
    *,
    method: str,
    path: str,
    params: dict[str, str] | None = None,
    json_payload: dict[str, Any] | None = None,
    prefer: str | None = None,
) -> Any:
    _ensure_supabase_service_configured(settings)
    url = f"{settings.supabase_url.rstrip('/')}/{path.lstrip('/')}"
    headers = _service_headers(settings)
    if json_payload is not None:
        headers["Content-Type"] = "application/json"
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
        raise StripeCheckoutRetryableError("Supabase timeout") from exc
    except httpx.HTTPError as exc:
        raise StripeCheckoutRetryableError("Supabase network error") from exc

    if response.status_code >= 400:
        raise StripeCheckoutApiError(
            _extract_error_message(response),
            status=response.status_code,
        )

    if not response.content:
        return None

    try:
        return response.json()
    except ValueError:
        return None


def _request_authenticated_user(
    settings: Settings, *, access_token: str
) -> dict[str, Any]:
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise StripeCheckoutConfigurationError(
            "SUPABASE_URL and SUPABASE_ANON_KEY must be configured"
        )

    url = f"{settings.supabase_url.rstrip('/')}/auth/v1/user"
    headers = {
        "apikey": settings.supabase_anon_key,
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, headers=headers)
    except httpx.TimeoutException as exc:
        raise StripeCheckoutRetryableError("Supabase timeout") from exc
    except httpx.HTTPError as exc:
        raise StripeCheckoutRetryableError("Supabase network error") from exc

    if response.status_code in {401, 403}:
        raise StripeCheckoutAuthError("Session invalide")
    if response.status_code >= 400:
        raise StripeCheckoutApiError(
            _extract_error_message(response),
            status=response.status_code,
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise StripeCheckoutApiError("Invalid Supabase user payload", status=502) from exc
    if not isinstance(payload, dict):
        raise StripeCheckoutApiError("Invalid Supabase user payload", status=502)
    return payload


def resolve_authenticated_checkout_customer(
    settings: Settings, *, access_token: str
) -> CheckoutCustomerReference:
    payload = _request_authenticated_user(settings, access_token=access_token)
    user_id = _normalize_text(payload.get("id"))
    if not user_id or not _is_valid_uuid(user_id):
        raise StripeCheckoutApiError("Missing Supabase user id", status=502)

    return CheckoutCustomerReference(
        user_id=user_id,
        email=_normalize_optional_email(payload.get("email")),
    )


def _load_active_products(settings: Settings) -> dict[str, dict[str, Any]]:
    try:
        payload = get_public_catalog(settings)
    except SupabaseCatalogConfigurationError as exc:
        raise StripeCheckoutConfigurationError(str(exc)) from exc
    except SupabaseCatalogRetryableError as exc:
        raise StripeCheckoutRetryableError(exc.message) from exc
    except SupabaseCatalogApiError as exc:
        raise StripeCheckoutApiError(exc.message, status=exc.status) from exc
    except Exception as exc:
        raise StripeCheckoutApiError("Lecture catalogue impossible", status=502) from exc

    products = payload.get("products") if isinstance(payload, dict) else []
    if not isinstance(products, list):
        return {}

    by_id: dict[str, dict[str, Any]] = {}
    for product in products:
        if not isinstance(product, dict):
            continue
        product_id = product.get("id")
        if isinstance(product_id, str) and product_id.strip():
            by_id[product_id] = product
    return by_id


def _build_line_items(
    settings: Settings, *, items: list[CheckoutCartItem]
) -> tuple[list[dict[str, Any]], int]:
    if not items:
        raise StripeCheckoutValidationError("Panier vide")

    merged_quantities: dict[tuple[str, str | None], int] = {}
    for item in items:
        product_id = item.product_id.strip()
        size = _normalize_size(item.size)
        if not product_id:
            raise StripeCheckoutValidationError("Produit invalide")
        if item.quantity <= 0:
            raise StripeCheckoutValidationError("Quantite invalide")
        if item.quantity > 20:
            raise StripeCheckoutValidationError("Quantite trop elevee")

        key = (product_id, size)
        merged_quantities[key] = merged_quantities.get(key, 0) + item.quantity

    total_quantity = sum(merged_quantities.values())

    products_by_id = _load_active_products(settings)
    line_items: list[dict[str, Any]] = []

    for (product_id, size), quantity in merged_quantities.items():
        product = products_by_id.get(product_id)
        if not product:
            raise StripeCheckoutValidationError("Produit indisponible")

        raw_name = product.get("name")
        name = raw_name.strip() if isinstance(raw_name, str) and raw_name.strip() else product_id

        raw_images = product.get("images")
        first_image: str | None = None
        if isinstance(raw_images, list):
            for image in raw_images:
                if isinstance(image, str) and image.strip():
                    first_image = image.strip()
                    break

        description = f"Taille {size}" if size else None
        product_data: dict[str, Any] = {
            "name": name,
            "metadata": {
                "product_id": product_id,
            },
        }
        if description:
            product_data["description"] = description
            product_data["metadata"]["size"] = size
        if first_image:
            product_data["images"] = [first_image]

        line_items.append(
            {
                "price_data": {
                    "currency": settings.stripe_currency,
                    "unit_amount": _to_minor_units(product.get("price")),
                    "product_data": product_data,
                },
                "quantity": quantity,
            }
        )

    return line_items, total_quantity


def create_checkout_session(
    settings: Settings,
    *,
    items: list[CheckoutCartItem],
    success_url: str,
    cancel_url: str,
    idempotency_key: str | None,
    customer: CheckoutCustomerReference | None,
) -> dict[str, str]:
    if not settings.stripe_secret_key:
        raise StripeCheckoutConfigurationError("STRIPE_SECRET_KEY must be configured")

    line_items, items_count = _build_line_items(settings, items=items)
    stripe.api_key = settings.stripe_secret_key
    stripe.max_network_retries = 2

    metadata = {"items_count": str(items_count)}
    create_kwargs: dict[str, Any] = {
        "mode": "payment",
        "line_items": line_items,
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": metadata,
    }

    if customer:
        create_kwargs["client_reference_id"] = customer.user_id
        metadata["user_id"] = customer.user_id
        if customer.email:
            create_kwargs["customer_email"] = customer.email

    try:
        if idempotency_key:
            session = stripe.checkout.Session.create(
                **create_kwargs,
                idempotency_key=idempotency_key,
            )
        else:
            session = stripe.checkout.Session.create(**create_kwargs)
    except (APIConnectionError, RateLimitError) as exc:
        raise StripeCheckoutRetryableError(_extract_stripe_message(exc)) from exc
    except AuthenticationError as exc:
        raise StripeCheckoutConfigurationError(_extract_stripe_message(exc)) from exc
    except APIError as exc:
        raise StripeCheckoutApiError(_extract_stripe_message(exc)) from exc
    except StripeError as exc:
        raise StripeCheckoutApiError(_extract_stripe_message(exc)) from exc

    session_id = session.get("id") if isinstance(session, dict) else getattr(session, "id", None)
    session_url = (
        session.get("url")
        if isinstance(session, dict)
        else getattr(session, "url", None)
    )

    if not isinstance(session_id, str) or not session_id.strip():
        raise StripeCheckoutApiError("Checkout Stripe invalide")
    if not isinstance(session_url, str) or not session_url.strip():
        raise StripeCheckoutApiError("URL checkout Stripe invalide")

    return {
        "session_id": session_id.strip(),
        "checkout_url": session_url.strip(),
    }


def verify_and_parse_stripe_webhook_event(
    settings: Settings, *, payload: bytes, stripe_signature: str | None
) -> dict[str, Any]:
    if not settings.stripe_webhook_secret:
        raise StripeCheckoutConfigurationError("STRIPE_WEBHOOK_SECRET must be configured")
    if not stripe_signature or not stripe_signature.strip():
        raise StripeWebhookSignatureError("Missing Stripe-Signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=stripe_signature.strip(),
            secret=settings.stripe_webhook_secret,
        )
    except ValueError as exc:
        raise StripeWebhookSignatureError("Invalid webhook payload") from exc
    except SignatureVerificationError as exc:
        raise StripeWebhookSignatureError("Invalid webhook signature") from exc

    if isinstance(event, dict):
        return event
    if hasattr(event, "to_dict_recursive"):
        converted = event.to_dict_recursive()
        if isinstance(converted, dict):
            return converted

    raise StripeCheckoutApiError("Invalid Stripe event payload", status=400)


def _build_order_number(session_id: str) -> str:
    cleaned = _ORDER_NUMBER_PATTERN.sub("", session_id.upper())
    suffix = cleaned[-12:] if len(cleaned) > 12 else cleaned
    if not suffix:
        raise StripeCheckoutValidationError("Invalid Stripe session id", status=400)
    return f"MM-{suffix}"


def _build_confirmed_order(
    settings: Settings,
    *,
    session: dict[str, Any],
    fallback_user_id: str | None = None,
) -> ConfirmedOrderData | None:
    session_id = _normalize_text(session.get("id"))
    if not session_id:
        raise StripeCheckoutValidationError("Invalid Stripe checkout session payload", status=400)

    metadata_payload = session.get("metadata")
    metadata = metadata_payload if isinstance(metadata_payload, dict) else {}

    raw_user_id = _normalize_text(session.get("client_reference_id"))
    if not raw_user_id:
        raw_user_id = _normalize_text(metadata.get("user_id"))
    if not raw_user_id:
        raw_user_id = _normalize_text(fallback_user_id)
    if not raw_user_id or not _is_valid_uuid(raw_user_id):
        return None

    raw_amount_total = session.get("amount_total")
    if isinstance(raw_amount_total, int):
        amount_total_cents = raw_amount_total
    elif isinstance(raw_amount_total, float) and raw_amount_total.is_integer():
        amount_total_cents = int(raw_amount_total)
    else:
        raise StripeCheckoutValidationError("Invalid Stripe amount_total", status=400)
    if amount_total_cents < 0:
        raise StripeCheckoutValidationError("Invalid Stripe amount_total", status=400)

    total_amount = float(
        (Decimal(amount_total_cents) / Decimal(100)).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )
    )

    raw_currency = _normalize_text(session.get("currency")).upper()
    currency = (
        raw_currency
        if len(raw_currency) == 3 and raw_currency.isalpha()
        else settings.stripe_currency.upper()
    )

    raw_items_count = metadata.get("items_count")
    items_count = 1
    if isinstance(raw_items_count, int):
        items_count = raw_items_count
    elif isinstance(raw_items_count, str) and raw_items_count.strip().isdigit():
        items_count = int(raw_items_count.strip())
    if items_count <= 0:
        items_count = 1

    created_at_raw = session.get("created")
    if isinstance(created_at_raw, int) and created_at_raw > 0:
        ordered_at = datetime.fromtimestamp(created_at_raw, tz=timezone.utc).isoformat()
    else:
        ordered_at = datetime.now(timezone.utc).isoformat()

    return ConfirmedOrderData(
        order_number=_build_order_number(session_id),
        user_id=raw_user_id,
        status="En preparation",
        total_amount=total_amount,
        currency=currency,
        items_count=items_count,
        ordered_at=ordered_at,
    )


def _upsert_confirmed_order(settings: Settings, *, order: ConfirmedOrderData) -> None:
    try:
        rows = _service_request_json(
            settings,
            method="POST",
            path=f"/rest/v1/{CUSTOMER_ORDERS_TABLE}",
            params={
                "on_conflict": "order_number",
                "select": "id,order_number",
            },
            prefer="resolution=merge-duplicates,return=representation",
            json_payload={
                "user_id": order.user_id,
                "order_number": order.order_number,
                "status": order.status,
                "total_amount": order.total_amount,
                "currency": order.currency,
                "items_count": order.items_count,
                "ordered_at": order.ordered_at,
            },
        )
    except StripeCheckoutApiError as exc:
        message = exc.message.lower()
        if exc.status == 400 and "on conflict" in message and "constraint" in message:
            raise StripeCheckoutConfigurationError(
                "customer_orders.order_number must have a UNIQUE constraint"
            ) from exc
        raise

    if not isinstance(rows, list) or not rows:
        raise StripeCheckoutApiError("Invalid order write payload", status=502)


def _retrieve_checkout_session(settings: Settings, *, session_id: str) -> dict[str, Any]:
    normalized_session_id = _normalize_text(session_id)
    if not normalized_session_id:
        raise StripeCheckoutValidationError("Session checkout invalide")
    if not settings.stripe_secret_key:
        raise StripeCheckoutConfigurationError("STRIPE_SECRET_KEY must be configured")

    stripe.api_key = settings.stripe_secret_key
    stripe.max_network_retries = 2

    try:
        session = stripe.checkout.Session.retrieve(normalized_session_id)
    except InvalidRequestError as exc:
        if getattr(exc, "code", "") == "resource_missing":
            raise StripeCheckoutValidationError("Session checkout introuvable", status=404) from exc
        raise StripeCheckoutValidationError(_extract_stripe_message(exc)) from exc
    except (APIConnectionError, RateLimitError) as exc:
        raise StripeCheckoutRetryableError(_extract_stripe_message(exc)) from exc
    except AuthenticationError as exc:
        raise StripeCheckoutConfigurationError(_extract_stripe_message(exc)) from exc
    except APIError as exc:
        raise StripeCheckoutApiError(_extract_stripe_message(exc)) from exc
    except StripeError as exc:
        raise StripeCheckoutApiError(_extract_stripe_message(exc)) from exc

    if isinstance(session, dict):
        return session
    if hasattr(session, "to_dict_recursive"):
        converted = session.to_dict_recursive()
        if isinstance(converted, dict):
            return converted

    raise StripeCheckoutApiError("Invalid Stripe checkout session payload", status=502)


def sync_checkout_session_order(
    settings: Settings,
    *,
    session_id: str,
    expected_user_id: str | None = None,
) -> dict[str, Any]:
    normalized_expected_user_id = _normalize_text(expected_user_id)
    if normalized_expected_user_id and not _is_valid_uuid(normalized_expected_user_id):
        raise StripeCheckoutValidationError("Identifiant utilisateur invalide")

    session = _retrieve_checkout_session(settings, session_id=session_id)
    payment_status = _normalize_text(session.get("payment_status")).lower()
    if payment_status != "paid":
        return {
            "payment_status": payment_status if payment_status else "unknown",
            "order_recorded": False,
            "order_number": None,
        }

    order = _build_confirmed_order(
        settings,
        session=session,
        fallback_user_id=normalized_expected_user_id or None,
    )
    if order is None:
        return {
            "payment_status": "paid",
            "order_recorded": False,
            "order_number": None,
        }

    if normalized_expected_user_id and order.user_id != normalized_expected_user_id:
        raise StripeCheckoutAuthError("Session checkout non associee au compte")

    _upsert_confirmed_order(settings, order=order)
    return {
        "payment_status": "paid",
        "order_recorded": True,
        "order_number": order.order_number,
    }


def handle_stripe_webhook_event(settings: Settings, *, event: dict[str, Any]) -> None:
    event_type = _normalize_text(event.get("type"))
    if event_type not in {
        "checkout.session.completed",
        "checkout.session.async_payment_succeeded",
    }:
        return

    data_payload = event.get("data")
    data = data_payload if isinstance(data_payload, dict) else {}
    object_payload = data.get("object")

    if isinstance(object_payload, dict):
        session = object_payload
    elif hasattr(object_payload, "to_dict_recursive"):
        converted = object_payload.to_dict_recursive()
        if isinstance(converted, dict):
            session = converted
        else:
            raise StripeCheckoutValidationError("Invalid Stripe event object", status=400)
    else:
        raise StripeCheckoutValidationError("Invalid Stripe event object", status=400)

    if event_type == "checkout.session.completed":
        payment_status = _normalize_text(session.get("payment_status")).lower()
        if payment_status != "paid":
            return

    order = _build_confirmed_order(settings, session=session)
    if order is None:
        return

    _upsert_confirmed_order(settings, order=order)
