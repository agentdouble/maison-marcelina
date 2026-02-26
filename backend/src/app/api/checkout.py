import logging
from typing import Any
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.config import Settings, get_settings
from app.services.stripe_checkout import (
    CheckoutCartItem,
    StripeCheckoutApiError,
    StripeCheckoutAuthError,
    StripeCheckoutConfigurationError,
    StripeCheckoutRetryableError,
    StripeCheckoutValidationError,
    StripeWebhookSignatureError,
    create_checkout_session,
    handle_stripe_webhook_event,
    resolve_authenticated_checkout_customer,
    sync_checkout_session_order,
    verify_and_parse_stripe_webhook_event,
)

router = APIRouter(prefix="/checkout", tags=["checkout"])
logger = logging.getLogger(__name__)


class CheckoutSessionLineItemRequest(BaseModel):
    product_id: str = Field(min_length=1, max_length=120)
    quantity: int = Field(ge=1, le=20)
    size: str | None = Field(default=None, max_length=40)


class CheckoutSessionCreateRequest(BaseModel):
    items: list[CheckoutSessionLineItemRequest] = Field(min_length=1, max_length=50)


def _normalize_origin(raw_value: str | None) -> str | None:
    if not raw_value:
        return None

    parsed = urlsplit(raw_value.strip())
    if parsed.scheme not in {"http", "https"}:
        return None
    if not parsed.netloc:
        return None
    if parsed.path not in {"", "/"}:
        return None
    if parsed.query or parsed.fragment:
        return None

    return f"{parsed.scheme}://{parsed.netloc}".rstrip("/")


def _resolve_checkout_origin(request: Request, settings: Settings) -> str:
    allowed_origins = {
        origin for origin in (_normalize_origin(value) for value in settings.cors_origins) if origin
    }
    default_origin = f"http://{settings.frontend_host}:{settings.frontend_port}"
    allowed_origins.add(default_origin)

    request_origin = _normalize_origin(request.headers.get("origin"))
    if request_origin and request_origin in allowed_origins:
        return request_origin

    return default_origin


def _normalize_idempotency_key(raw_key: str | None) -> str | None:
    if raw_key is None:
        return None
    cleaned = raw_key.strip()
    if not cleaned:
        return None
    if len(cleaned) > 255:
        raise HTTPException(status_code=400, detail="Idempotency-Key too long")
    return cleaned


def _extract_optional_access_token(
    authorization: str | None = Header(default=None),
) -> str | None:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="Invalid bearer token")
    return token.strip()


def _raise_checkout_error(exc: Exception) -> None:
    if isinstance(exc, StripeCheckoutConfigurationError):
        raise HTTPException(status_code=500, detail=str(exc))
    if isinstance(exc, StripeCheckoutAuthError):
        raise HTTPException(status_code=401, detail=exc.message)
    if isinstance(exc, StripeWebhookSignatureError):
        raise HTTPException(status_code=400, detail=exc.message)
    if isinstance(exc, StripeCheckoutValidationError):
        raise HTTPException(status_code=exc.status, detail=exc.message)
    if isinstance(exc, StripeCheckoutRetryableError):
        raise HTTPException(status_code=503, detail=exc.message)
    if isinstance(exc, StripeCheckoutApiError):
        status_code = exc.status if 400 <= exc.status < 600 else 502
        raise HTTPException(status_code=status_code, detail=exc.message)
    raise HTTPException(status_code=500, detail="Unexpected checkout error")


def _log_checkout_error(context: str, exc: Exception) -> None:
    if isinstance(exc, StripeCheckoutApiError):
        logger.warning("%s failed (status=%s): %s", context, exc.status, exc.message)
        return
    if isinstance(exc, StripeCheckoutAuthError):
        logger.warning("%s failed (auth): %s", context, exc.message)
        return
    if isinstance(exc, StripeWebhookSignatureError):
        logger.warning("%s failed (signature): %s", context, exc.message)
        return
    if isinstance(exc, StripeCheckoutValidationError):
        logger.warning("%s failed (validation): %s", context, exc.message)
        return
    if isinstance(exc, StripeCheckoutRetryableError):
        logger.warning("%s failed (retryable): %s", context, exc.message)
        return
    logger.warning("%s failed (unexpected): %s", context, str(exc))


@router.post("/session")
def checkout_session_create(
    payload: CheckoutSessionCreateRequest,
    request: Request,
    idempotency_key: str | None = Header(default=None, alias="Idempotency-Key"),
    access_token: str | None = Depends(_extract_optional_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    origin = _resolve_checkout_origin(request, settings)

    try:
        normalized_items = [
            CheckoutCartItem(
                product_id=item.product_id,
                quantity=item.quantity,
                size=item.size,
            )
            for item in payload.items
        ]
        customer = (
            resolve_authenticated_checkout_customer(settings, access_token=access_token)
            if access_token
            else None
        )

        return create_checkout_session(
            settings,
            items=normalized_items,
            success_url=f"{origin}/commande/confirmation?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/commande/annulee",
            idempotency_key=_normalize_idempotency_key(idempotency_key),
            customer=customer,
        )
    except HTTPException:
        raise
    except Exception as exc:
        _log_checkout_error("Checkout session create", exc)
        _raise_checkout_error(exc)


@router.post("/session/{session_id}/sync")
def checkout_session_sync(
    session_id: str,
    access_token: str | None = Depends(_extract_optional_access_token),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        user_id: str | None = None
        if access_token:
            user_id = resolve_authenticated_checkout_customer(
                settings,
                access_token=access_token,
            ).user_id
        return sync_checkout_session_order(
            settings,
            session_id=session_id,
            expected_user_id=user_id,
        )
    except HTTPException:
        raise
    except Exception as exc:
        _log_checkout_error("Checkout session sync", exc)
        _raise_checkout_error(exc)


@router.post("/webhook/stripe")
async def checkout_stripe_webhook(
    request: Request,
    stripe_signature: str | None = Header(default=None, alias="Stripe-Signature"),
    settings: Settings = Depends(get_settings),
) -> dict[str, bool]:
    payload = await request.body()

    try:
        event = verify_and_parse_stripe_webhook_event(
            settings,
            payload=payload,
            stripe_signature=stripe_signature,
        )
        handle_stripe_webhook_event(settings, event=event)
    except Exception as exc:
        _log_checkout_error("Stripe webhook", exc)
        _raise_checkout_error(exc)

    return {"received": True}
