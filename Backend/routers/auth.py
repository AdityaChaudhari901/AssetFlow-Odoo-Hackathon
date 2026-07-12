"""Authentication endpoints (proxied Supabase Auth)."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from core.auth import CurrentUser, get_current_user
from schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
)
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])
_bearer = HTTPBearer(auto_error=False)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest) -> dict:
    """Create an Employee account. Roles are never selected at signup."""
    return auth_service.signup(payload)


@router.post("/login")
def login(payload: LoginRequest) -> dict:
    return auth_service.login(payload)


@router.post("/refresh")
def refresh(payload: RefreshRequest) -> dict:
    return auth_service.refresh(payload.refresh_token)


@router.post("/logout")
def logout(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)],
) -> dict:
    return auth_service.logout(credentials.credentials if credentials else "")


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest) -> dict:
    return auth_service.forgot_password(payload.email)


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest) -> dict:
    return auth_service.reset_password(payload)


@router.get("/me")
def me(user: Annotated[CurrentUser, Depends(get_current_user)]) -> dict:
    return auth_service.me(user)
