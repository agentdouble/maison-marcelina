import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.supabase_account import SupabaseAccountAuthError


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_account_profile_requires_bearer(client: TestClient) -> None:
    response = client.get("/account/profile")

    assert response.status_code == 401
    assert response.json() == {"detail": "Missing bearer token"}


def test_account_profile_get_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_get_account_profile(settings: object, *, access_token: str) -> dict[str, object]:
        assert access_token == "access-token"
        return {
            "email": "user@example.com",
            "full_name": "Client Test",
            "phone": "+33600000000",
            "address": "12 rue Test",
            "created_at": "2026-02-22T20:00:00+00:00",
            "updated_at": "2026-02-22T20:00:00+00:00",
        }

    monkeypatch.setattr("app.api.account.get_account_profile", fake_get_account_profile)

    response = client.get(
        "/account/profile",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Client Test"


def test_account_profile_upsert_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_upsert_account_profile(
        settings: object,
        *,
        access_token: str,
        full_name: str | None,
        phone: str | None,
        address: str | None,
    ) -> dict[str, object]:
        assert access_token == "access-token"
        assert full_name == "Client Test"
        assert phone == "+33600000000"
        assert address == "12 rue Test"
        return {
            "email": "user@example.com",
            "full_name": full_name,
            "phone": phone,
            "address": address,
            "created_at": "2026-02-22T20:00:00+00:00",
            "updated_at": "2026-02-22T20:00:00+00:00",
        }

    monkeypatch.setattr("app.api.account.upsert_account_profile", fake_upsert_account_profile)

    response = client.put(
        "/account/profile",
        headers={"Authorization": "Bearer access-token"},
        json={
            "full_name": "Client Test",
            "phone": "+33600000000",
            "address": "12 rue Test",
        },
    )

    assert response.status_code == 200
    assert response.json()["address"] == "12 rue Test"


def test_account_orders_list_success(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_list_account_orders(
        settings: object, *, access_token: str
    ) -> list[dict[str, object]]:
        assert access_token == "access-token"
        return [
            {
                "id": 1,
                "order_number": "MM-1001",
                "status": "Livree",
                "total_amount": 129.0,
                "currency": "EUR",
                "items_count": 2,
                "ordered_at": "2026-02-22T20:00:00+00:00",
                "created_at": "2026-02-22T20:00:00+00:00",
            }
        ]

    monkeypatch.setattr("app.api.account.list_account_orders", fake_list_account_orders)

    response = client.get(
        "/account/orders",
        headers={"Authorization": "Bearer access-token"},
    )

    assert response.status_code == 200
    assert response.json()["orders"][0]["order_number"] == "MM-1001"


def test_account_profile_upsert_auth_error(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_upsert_account_profile(
        settings: object,
        *,
        access_token: str,
        full_name: str | None,
        phone: str | None,
        address: str | None,
    ) -> dict[str, object]:
        raise SupabaseAccountAuthError("Session invalide")

    monkeypatch.setattr("app.api.account.upsert_account_profile", fake_upsert_account_profile)

    response = client.put(
        "/account/profile",
        headers={"Authorization": "Bearer access-token"},
        json={
            "full_name": "Client Test",
            "phone": "+33600000000",
            "address": "12 rue Test",
        },
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Session invalide"}
