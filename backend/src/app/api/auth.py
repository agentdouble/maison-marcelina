import base64
import binascii
import json
import logging
import secrets
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse, RedirectResponse, Response
from pydantic import BaseModel, Field
from supabase_auth.errors import AuthError, AuthRetryableError

from app.core.config import Settings, get_settings
from app.services.supabase_auth import (
    SupabaseConfigurationError,
    SupabaseOAuthStartError,
    exchange_google_code,
    sign_in_with_password,
    sign_up_with_password,
    start_google_oauth,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)

GOOGLE_OAUTH_COOKIE_NAME = "mm_google_oauth"
GOOGLE_OAUTH_TTL_SECONDS = 600
GOOGLE_OAUTH_COOKIE_PATH = "/auth/google/callback"


class PasswordLoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1)


class PasswordSignUpRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1)


def _encode_google_oauth_cookie(*, state: str, code_verifier: str) -> str:
    payload = {"state": state, "code_verifier": code_verifier}
    serialized = json.dumps(payload, separators=(",", ":"))
    return base64.urlsafe_b64encode(serialized.encode("utf-8")).decode("utf-8")


def _decode_google_oauth_cookie(cookie_value: str) -> tuple[str, str]:
    try:
        padding = "=" * (-len(cookie_value) % 4)
        encoded = f"{cookie_value}{padding}"
        decoded = base64.urlsafe_b64decode(encoded.encode("utf-8")).decode("utf-8")
        payload = json.loads(decoded)
        return payload["state"], payload["code_verifier"]
    except (binascii.Error, json.JSONDecodeError, KeyError, TypeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid Google OAuth state cookie")


def _set_google_oauth_cookie(
    response: Response, settings: Settings, *, state: str, code_verifier: str
) -> None:
    response.set_cookie(
        key=GOOGLE_OAUTH_COOKIE_NAME,
        value=_encode_google_oauth_cookie(state=state, code_verifier=code_verifier),
        max_age=GOOGLE_OAUTH_TTL_SECONDS,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path=GOOGLE_OAUTH_COOKIE_PATH,
    )


def _clear_google_oauth_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=GOOGLE_OAUTH_COOKIE_NAME,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path=GOOGLE_OAUTH_COOKIE_PATH,
    )


def _raise_auth_error(exc: Exception) -> None:
    if isinstance(exc, SupabaseConfigurationError):
        raise HTTPException(status_code=500, detail=str(exc))
    if isinstance(exc, SupabaseOAuthStartError):
        raise HTTPException(status_code=500, detail=str(exc))
    if isinstance(exc, AuthRetryableError):
        raise HTTPException(status_code=503, detail=exc.message)
    if isinstance(exc, AuthError):
        raw_status = getattr(exc, "status", None)
        status_code = (
            raw_status if isinstance(raw_status, int) and 400 <= raw_status < 600 else 500
        )
        detail = exc.message if exc.message else "Authentication failed"
        raise HTTPException(status_code=status_code, detail=detail)
    raise HTTPException(status_code=500, detail="Unexpected authentication error")


@router.post("/login")
def password_login(
    payload: PasswordLoginRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return sign_in_with_password(
            settings,
            email=payload.email,
            password=payload.password,
        )
    except Exception as exc:
        logger.warning("Password login failed")
        _raise_auth_error(exc)


@router.post("/signup")
def password_signup(
    payload: PasswordSignUpRequest,
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    try:
        return sign_up_with_password(
            settings,
            email=payload.email,
            password=payload.password,
        )
    except Exception as exc:
        logger.warning("Password signup failed")
        _raise_auth_error(exc)


@router.get("/google/start")
def google_start(
    redirect: bool = Query(default=True),
    settings: Settings = Depends(get_settings),
) -> Response:
    state = secrets.token_urlsafe(32)
    try:
        authorization_url, code_verifier = start_google_oauth(settings, state=state)
    except Exception as exc:
        logger.warning("Google OAuth start failed")
        _raise_auth_error(exc)

    if redirect:
        response: Response = RedirectResponse(url=authorization_url, status_code=307)
    else:
        response = JSONResponse({"authorization_url": authorization_url})

    _set_google_oauth_cookie(
        response,
        settings,
        state=state,
        code_verifier=code_verifier,
    )
    return response


@router.get("/google/callback")
def google_callback(
    request: Request,
    code: str | None = Query(default=None),
    state: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
    settings: Settings = Depends(get_settings),
) -> Response:
    if error:
        detail = error_description or error
        raise HTTPException(status_code=400, detail=detail)
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state")

    cookie_value = request.cookies.get(GOOGLE_OAUTH_COOKIE_NAME)
    if not cookie_value:
        raise HTTPException(status_code=400, detail="Missing Google OAuth state cookie")

    expected_state, code_verifier = _decode_google_oauth_cookie(cookie_value)
    if state != expected_state:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        payload = exchange_google_code(
            settings,
            auth_code=code,
            code_verifier=code_verifier,
        )
    except Exception as exc:
        logger.warning("Google OAuth callback failed")
        _raise_auth_error(exc)

    response = JSONResponse(payload)
    _clear_google_oauth_cookie(response, settings)
    return response
