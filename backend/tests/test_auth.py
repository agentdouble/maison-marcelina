import pytest
from fastapi.testclient import TestClient
from supabase_auth.errors import AuthApiError, AuthWeakPasswordError

from app.api.auth import GOOGLE_OAUTH_COOKIE_NAME
from app.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def test_password_login_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_sign_in_with_password(
        settings: object, *, email: str, password: str
    ) -> dict[str, object]:
        assert email == "user@example.com"
        assert password == "strong-password"
        return {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "token_type": "bearer",
            "expires_in": 3600,
            "expires_at": 1730000000,
            "user": {"id": "user-id"},
        }

    monkeypatch.setattr(
        "app.api.auth.sign_in_with_password",
        fake_sign_in_with_password,
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "user@example.com",
            "password": "strong-password",
        },
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "access-token"


def test_password_login_auth_error(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_sign_in_with_password(
        settings: object, *, email: str, password: str
    ) -> dict[str, object]:
        raise AuthApiError("Invalid login credentials", 401, None)

    monkeypatch.setattr(
        "app.api.auth.sign_in_with_password",
        fake_sign_in_with_password,
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "user@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid login credentials"}


def test_password_signup_success(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_sign_up_with_password(
        settings: object, *, email: str, password: str
    ) -> dict[str, object]:
        assert email == "new-user@example.com"
        assert password == "strong-password"
        return {
            "access_token": None,
            "refresh_token": None,
            "token_type": None,
            "expires_in": None,
            "expires_at": None,
            "user": {"id": "user-id"},
        }

    monkeypatch.setattr(
        "app.api.auth.sign_up_with_password",
        fake_sign_up_with_password,
    )

    response = client.post(
        "/auth/signup",
        json={
            "email": "new-user@example.com",
            "password": "strong-password",
        },
    )

    assert response.status_code == 200
    assert response.json()["user"]["id"] == "user-id"


def test_password_signup_auth_error(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    def fake_sign_up_with_password(
        settings: object, *, email: str, password: str
    ) -> dict[str, object]:
        raise AuthApiError("User already registered", 400, None)

    monkeypatch.setattr(
        "app.api.auth.sign_up_with_password",
        fake_sign_up_with_password,
    )

    response = client.post(
        "/auth/signup",
        json={
            "email": "new-user@example.com",
            "password": "strong-password",
        },
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "User already registered"}


def test_password_signup_weak_password_error(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def fake_sign_up_with_password(
        settings: object, *, email: str, password: str
    ) -> dict[str, object]:
        raise AuthWeakPasswordError(
            "Password should be at least 6 characters",
            422,
            ["length"],
        )

    monkeypatch.setattr(
        "app.api.auth.sign_up_with_password",
        fake_sign_up_with_password,
    )

    response = client.post(
        "/auth/signup",
        json={
            "email": "new-user@example.com",
            "password": "123",
        },
    )

    assert response.status_code == 422
    assert response.json() == {"detail": "Password should be at least 6 characters"}


def test_google_start_sets_oauth_cookie(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        "app.api.auth.secrets.token_urlsafe",
        lambda _: "state-123",
    )
    monkeypatch.setattr(
        "app.api.auth.start_google_oauth",
        lambda settings, state: (
            "https://accounts.google.test/oauth",
            "code-verifier-123",
        ),
    )

    response = client.get("/auth/google/start?redirect=false")

    assert response.status_code == 200
    assert response.json() == {"authorization_url": "https://accounts.google.test/oauth"}
    assert GOOGLE_OAUTH_COOKIE_NAME in response.headers["set-cookie"]


def test_google_callback_exchanges_code(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        "app.api.auth.secrets.token_urlsafe",
        lambda _: "state-abc",
    )
    monkeypatch.setattr(
        "app.api.auth.start_google_oauth",
        lambda settings, state: ("https://accounts.google.test/oauth", "verifier-abc"),
    )

    exchanged: dict[str, str] = {}

    def fake_exchange_google_code(
        settings: object, *, auth_code: str, code_verifier: str
    ) -> dict[str, object]:
        exchanged["auth_code"] = auth_code
        exchanged["code_verifier"] = code_verifier
        return {
            "access_token": "access",
            "refresh_token": "refresh",
            "token_type": "bearer",
            "expires_in": 3600,
            "expires_at": 1730000000,
            "user": {"id": "user-id"},
        }

    monkeypatch.setattr(
        "app.api.auth.exchange_google_code",
        fake_exchange_google_code,
    )

    start_response = client.get("/auth/google/start?redirect=false")
    assert start_response.status_code == 200

    callback_response = client.get("/auth/google/callback?code=auth-code-1&state=state-abc")

    assert callback_response.status_code == 200
    assert callback_response.json()["access_token"] == "access"
    assert exchanged == {
        "auth_code": "auth-code-1",
        "code_verifier": "verifier-abc",
    }


def test_google_callback_rejects_invalid_state(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(
        "app.api.auth.secrets.token_urlsafe",
        lambda _: "state-original",
    )
    monkeypatch.setattr(
        "app.api.auth.start_google_oauth",
        lambda settings, state: ("https://accounts.google.test/oauth", "verifier-original"),
    )

    start_response = client.get("/auth/google/start?redirect=false")
    assert start_response.status_code == 200

    callback_response = client.get(
        "/auth/google/callback?code=auth-code-1&state=state-different"
    )

    assert callback_response.status_code == 400
    assert callback_response.json() == {"detail": "Invalid OAuth state"}
