"""Auth flows proxied to Supabase Auth. Signup always creates an Employee."""

import logging
import time
from typing import Any

from supabase_auth.errors import AuthApiError

from config.settings import get_settings
from core.auth import CurrentUser, decode_token, fetch_profile
from core.errors import ApiError
from database.supabase import get_auth_client, get_service_client
from schemas.auth import LoginRequest, ResetPasswordRequest, SignupRequest
from services.serializers import profile_out, session_out

logger = logging.getLogger(__name__)


def _profile_with_retry(user_id: str, attempts: int = 3) -> dict[str, Any]:
    """The on-signup trigger commits with the auth user; retry covers edge lag."""
    for attempt in range(attempts):
        profile = fetch_profile(user_id)
        if profile is not None:
            return profile
        time.sleep(0.2 * (attempt + 1))
    raise ApiError(500, "INTERNAL_SERVER_ERROR", "Profile was not provisioned.")


def signup(payload: SignupRequest) -> dict[str, Any]:
    try:
        result = get_auth_client().auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
                "options": {"data": {"full_name": payload.full_name}},
            }
        )
    except AuthApiError as exc:
        if "already registered" in exc.message.lower():
            raise ApiError.conflict(
                "EMAIL_ALREADY_REGISTERED", "An account with this email already exists."
            ) from exc
        raise ApiError(400, "SIGNUP_FAILED", exc.message) from exc

    if result.user is None:
        # Supabase obfuscates existing emails by returning a user-less response.
        raise ApiError.conflict(
            "EMAIL_ALREADY_REGISTERED", "An account with this email already exists."
        )

    profile = _profile_with_retry(result.user.id)
    return {
        "data": {"user": profile_out(profile), "session": session_out(result.session)}
    }


def login(payload: LoginRequest) -> dict[str, Any]:
    try:
        result = get_auth_client().auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except AuthApiError as exc:
        raise ApiError.unauthorized(
            "INVALID_CREDENTIALS", "Invalid email or password."
        ) from exc

    profile = fetch_profile(result.user.id)
    if profile is None:
        raise ApiError.unauthorized("INVALID_CREDENTIALS", "Invalid email or password.")
    if profile["status"] != "active":
        raise ApiError(403, "ACCOUNT_INACTIVE", "This account has been deactivated.")
    return {
        "data": {"user": profile_out(profile), "session": session_out(result.session)}
    }


def refresh(refresh_token: str) -> dict[str, Any]:
    try:
        result = get_auth_client().auth.refresh_session(refresh_token)
    except AuthApiError as exc:
        raise ApiError.unauthorized(
            "INVALID_REFRESH_TOKEN", "Session expired. Please log in again."
        ) from exc
    return {"data": {"session": session_out(result.session)}}


def logout(access_token: str, refresh_token: str | None = None) -> dict[str, Any]:
    try:
        if not access_token and refresh_token:
            result = get_auth_client().auth.refresh_session(refresh_token)
            access_token = result.session.access_token if result.session else ""
        if not access_token:
            return {"data": {"ok": True}}
        get_service_client().auth.admin.sign_out(access_token)
    except Exception:  # best-effort: an already-dead session is fine
        logger.info("Logout: session already invalid")
    return {"data": {"ok": True}}


def forgot_password(email: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        get_auth_client().auth.reset_password_for_email(
            email,
            {"redirect_to": f"{settings.frontend_url.rstrip('/')}/reset-password"},
        )
    except AuthApiError:  # never leak whether the email exists
        logger.info("Password reset requested for unknown email")
    return {"data": {"sent": True}}


def reset_password(payload: ResetPasswordRequest) -> dict[str, Any]:
    claims = decode_token(payload.recovery_token)
    get_service_client().auth.admin.update_user_by_id(
        claims["sub"], {"password": payload.new_password}
    )
    return {"data": {"ok": True}}


def me(user: CurrentUser) -> dict[str, Any]:
    profile = fetch_profile(user.id)
    if profile is None:
        raise ApiError.unauthorized()
    return {"data": profile_out(profile)}
