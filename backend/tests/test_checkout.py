import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.stripe_checkout import (
    CheckoutCustomerReference,
    StripeCheckoutConfigurationError,
    StripeWebhookSignatureError,
)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_checkout_session_create_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, object] = {}

    def fake_create_checkout_session(
        settings: object,
        *,
        items: list[object],
        success_url: str,
        cancel_url: str,
        idempotency_key: str | None,
        customer: object | None,
    ) -> dict[str, str]:
        captured["items"] = items
        captured["success_url"] = success_url
        captured["cancel_url"] = cancel_url
        captured["idempotency_key"] = idempotency_key
        captured["customer"] = customer
        return {
            "session_id": "cs_test_123",
            "checkout_url": "https://checkout.stripe.test/session/cs_test_123",
        }

    monkeypatch.setattr("app.api.checkout.create_checkout_session", fake_create_checkout_session)

    response = client.post(
        "/checkout/session",
        headers={
            "Origin": "http://localhost:3000",
            "Idempotency-Key": "idem-key-1",
        },
        json={
            "items": [
                {
                    "product_id": "product-1",
                    "quantity": 2,
                    "size": "38",
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "session_id": "cs_test_123",
        "checkout_url": "https://checkout.stripe.test/session/cs_test_123",
    }
    assert (
        captured["success_url"]
        == "http://localhost:3000/commande/confirmation?session_id={CHECKOUT_SESSION_ID}"
    )
    assert captured["cancel_url"] == "http://localhost:3000/commande/annulee"
    assert captured["idempotency_key"] == "idem-key-1"
    assert captured["customer"] is None
    captured_items = captured["items"]
    assert isinstance(captured_items, list)
    assert len(captured_items) == 1
    first_item = captured_items[0]
    assert getattr(first_item, "product_id") == "product-1"
    assert getattr(first_item, "quantity") == 2
    assert getattr(first_item, "size") == "38"


def test_checkout_session_uses_default_origin_when_header_is_invalid(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured_success_url = {"value": ""}

    def fake_create_checkout_session(
        settings: object,
        *,
        items: list[object],
        success_url: str,
        cancel_url: str,
        idempotency_key: str | None,
        customer: object | None,
    ) -> dict[str, str]:
        captured_success_url["value"] = success_url
        return {
            "session_id": "cs_test_456",
            "checkout_url": "https://checkout.stripe.test/session/cs_test_456",
        }

    monkeypatch.setattr("app.api.checkout.create_checkout_session", fake_create_checkout_session)

    response = client.post(
        "/checkout/session",
        headers={"Origin": "https://evil.example"},
        json={"items": [{"product_id": "product-1", "quantity": 1}]},
    )

    assert response.status_code == 200
    assert (
        captured_success_url["value"]
        == "http://127.0.0.1:3000/commande/confirmation?session_id={CHECKOUT_SESSION_ID}"
    )


def test_checkout_session_returns_configuration_error(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_create_checkout_session(
        settings: object,
        *,
        items: list[object],
        success_url: str,
        cancel_url: str,
        idempotency_key: str | None,
        customer: object | None,
    ) -> dict[str, str]:
        raise StripeCheckoutConfigurationError("STRIPE_SECRET_KEY must be configured")

    monkeypatch.setattr("app.api.checkout.create_checkout_session", fake_create_checkout_session)

    response = client.post(
        "/checkout/session",
        json={"items": [{"product_id": "product-1", "quantity": 1}]},
    )

    assert response.status_code == 500
    assert response.json() == {"detail": "STRIPE_SECRET_KEY must be configured"}


def test_checkout_session_rejects_too_long_idempotency_key(client: TestClient) -> None:
    response = client.post(
        "/checkout/session",
        headers={"Idempotency-Key": "x" * 256},
        json={"items": [{"product_id": "product-1", "quantity": 1}]},
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Idempotency-Key too long"}


def test_checkout_session_resolves_customer_from_bearer_token(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured_user_id = {"value": ""}

    def fake_resolve_authenticated_checkout_customer(
        settings: object, *, access_token: str
    ) -> CheckoutCustomerReference:
        assert access_token == "access-token"
        return CheckoutCustomerReference(
            user_id="d29f0f6e-45fe-4f90-b957-865c0f478f11",
            email="buyer@example.com",
        )

    def fake_create_checkout_session(
        settings: object,
        *,
        items: list[object],
        success_url: str,
        cancel_url: str,
        idempotency_key: str | None,
        customer: CheckoutCustomerReference | None,
    ) -> dict[str, str]:
        assert customer is not None
        captured_user_id["value"] = customer.user_id
        return {
            "session_id": "cs_test_789",
            "checkout_url": "https://checkout.stripe.test/session/cs_test_789",
        }

    monkeypatch.setattr(
        "app.api.checkout.resolve_authenticated_checkout_customer",
        fake_resolve_authenticated_checkout_customer,
    )
    monkeypatch.setattr("app.api.checkout.create_checkout_session", fake_create_checkout_session)

    response = client.post(
        "/checkout/session",
        headers={"Authorization": "Bearer access-token"},
        json={"items": [{"product_id": "product-1", "quantity": 1}]},
    )

    assert response.status_code == 200
    assert captured_user_id["value"] == "d29f0f6e-45fe-4f90-b957-865c0f478f11"


def test_checkout_session_rejects_invalid_bearer_token(client: TestClient) -> None:
    response = client.post(
        "/checkout/session",
        headers={"Authorization": "bad-token"},
        json={"items": [{"product_id": "product-1", "quantity": 1}]},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid bearer token"}


def test_checkout_session_sync_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    captured: dict[str, str | None] = {"session_id": None, "expected_user_id": None}

    def fake_sync_checkout_session_order(
        settings: object,
        *,
        session_id: str,
        expected_user_id: str | None,
    ) -> dict[str, object]:
        captured["session_id"] = session_id
        captured["expected_user_id"] = expected_user_id
        return {
            "payment_status": "paid",
            "order_recorded": True,
            "order_number": "MM-TESTSYNC",
        }

    monkeypatch.setattr("app.api.checkout.sync_checkout_session_order", fake_sync_checkout_session_order)

    response = client.post("/checkout/session/cs_test_sync/sync")

    assert response.status_code == 200
    assert response.json() == {
        "payment_status": "paid",
        "order_recorded": True,
        "order_number": "MM-TESTSYNC",
    }
    assert captured["session_id"] == "cs_test_sync"
    assert captured["expected_user_id"] is None


def test_checkout_session_sync_uses_authenticated_user(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_resolve_authenticated_checkout_customer(
        settings: object, *, access_token: str
    ) -> CheckoutCustomerReference:
        assert access_token == "access-token"
        return CheckoutCustomerReference(
            user_id="d29f0f6e-45fe-4f90-b957-865c0f478f11",
            email="buyer@example.com",
        )

    def fake_sync_checkout_session_order(
        settings: object,
        *,
        session_id: str,
        expected_user_id: str | None,
    ) -> dict[str, object]:
        assert session_id == "cs_test_auth"
        assert expected_user_id == "d29f0f6e-45fe-4f90-b957-865c0f478f11"
        return {
            "payment_status": "paid",
            "order_recorded": True,
            "order_number": "MM-TESTAUTH",
        }

    monkeypatch.setattr(
        "app.api.checkout.resolve_authenticated_checkout_customer",
        fake_resolve_authenticated_checkout_customer,
    )
    monkeypatch.setattr("app.api.checkout.sync_checkout_session_order", fake_sync_checkout_session_order)

    response = client.post(
        "/checkout/session/cs_test_auth/sync",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 200
    assert response.json()["order_number"] == "MM-TESTAUTH"


def test_checkout_session_sync_rejects_invalid_bearer_token(client: TestClient) -> None:
    response = client.post(
        "/checkout/session/cs_test_sync/sync",
        headers={"Authorization": "bad-token"},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid bearer token"}


def test_stripe_webhook_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    called = {"handled": False}

    def fake_verify_and_parse(
        settings: object, *, payload: bytes, stripe_signature: str | None
    ) -> dict[str, object]:
        assert payload == b'{"id":"evt_123"}'
        assert stripe_signature == "t=1,v1=abc"
        return {
            "id": "evt_123",
            "type": "checkout.session.completed",
            "data": {"object": {"id": "cs_test_123", "payment_status": "paid"}},
        }

    def fake_handle(settings: object, *, event: dict[str, object]) -> None:
        assert event["id"] == "evt_123"
        called["handled"] = True

    monkeypatch.setattr(
        "app.api.checkout.verify_and_parse_stripe_webhook_event",
        fake_verify_and_parse,
    )
    monkeypatch.setattr("app.api.checkout.handle_stripe_webhook_event", fake_handle)

    response = client.post(
        "/checkout/webhook/stripe",
        headers={"Stripe-Signature": "t=1,v1=abc"},
        content=b'{"id":"evt_123"}',
    )

    assert response.status_code == 200
    assert response.json() == {"received": True}
    assert called["handled"] is True


def test_stripe_webhook_rejects_invalid_signature(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_verify_and_parse(
        settings: object, *, payload: bytes, stripe_signature: str | None
    ) -> dict[str, object]:
        raise StripeWebhookSignatureError("Invalid webhook signature")

    monkeypatch.setattr(
        "app.api.checkout.verify_and_parse_stripe_webhook_event",
        fake_verify_and_parse,
    )

    response = client.post(
        "/checkout/webhook/stripe",
        headers={"Stripe-Signature": "t=1,v1=bad"},
        content=b"{}",
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid webhook signature"}
