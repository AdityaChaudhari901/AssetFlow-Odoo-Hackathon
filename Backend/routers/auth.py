"""Authentication endpoints (proxied Supabase Auth)."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.auth import CurrentUser, get_current_user
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
)
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])
_bearer = HTTPBearer(auto_error=False)
REFRESH_COOKIE = "assetflow_refresh"


def _store_refresh_cookie(response: Response, payload: dict) -> dict:
    from config.settings import get_settings

    settings = get_settings()
    session = payload.get("data", {}).get("session") or {}
    refresh_token = session.pop("refresh_token", None)
    if refresh_token:
        response.set_cookie(
            REFRESH_COOKIE,
            refresh_token,
            httponly=True,
            secure=settings.environment in {"staging", "production"},
            samesite="lax",
            max_age=60 * 60 * 24 * 30,
            path=f"{settings.api_v1_prefix}/auth",
        )
    return payload


def _clear_refresh_cookie(response: Response) -> None:
    from config.settings import get_settings

    settings = get_settings()
    response.delete_cookie(
        REFRESH_COOKIE,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.environment in {"staging", "production"},
        httponly=True,
        samesite="lax",
    )


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, response: Response) -> dict:
    """Create an Employee account. Roles are never selected at signup."""
    return _store_refresh_cookie(response, auth_service.signup(payload))


@router.post("/login")
def login(payload: LoginRequest, response: Response) -> dict:
    return _store_refresh_cookie(response, auth_service.login(payload))


@router.post("/refresh")
def refresh(request: Request, response: Response) -> dict:
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    if not refresh_token:
        from core.errors import ApiError

        raise ApiError.unauthorized("AUTH_REQUIRED", "A refresh session is required.")
    return _store_refresh_cookie(response, auth_service.refresh(refresh_token))


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)],
) -> dict:
    refresh_token = request.cookies.get(REFRESH_COOKIE)
    payload = auth_service.logout(
        credentials.credentials if credentials else "",
        refresh_token,
    )
    _clear_refresh_cookie(response)
    return payload


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest) -> dict:
    return auth_service.forgot_password(payload.email)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest) -> dict:
    return auth_service.reset_password(payload)


@router.get("/me")
def me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> dict:
    return auth_service.me(user)
