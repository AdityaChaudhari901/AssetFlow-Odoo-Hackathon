"""Request authentication: Supabase JWT verification + current-user dependency."""

from functools import lru_cache
from typing import Annotated, Any, Optional

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from config.settings import get_settings
from core.errors import ApiError
from database.supabase import get_service_client

_bearer = HTTPBearer(auto_error=False)

PROFILE_SELECT = (
    "id, full_name, email, role, department_id, status, avatar_url, created_at, "
    "department:departments!profiles_department_id_fkey(id, name)"
)


class CurrentUser(BaseModel):
    """Authenticated caller, resolved from the JWT + profiles table."""

    id: str
    full_name: str
    email: str
    role: str
    department_id: Optional[str] = None
    department_name: Optional[str] = None
    status: str


@lru_cache(maxsize=1)
def _jwks_client() -> jwt.PyJWKClient:
    settings = get_settings()
    url = f"{str(settings.supabase_url).rstrip('/')}/auth/v1/.well-known/jwks.json"
    return jwt.PyJWKClient(url, cache_keys=True)


def decode_token(token: str) -> dict[str, Any]:
    """Verify a Supabase access token locally and return its claims.

    Uses the legacy HS256 secret when configured, otherwise the project JWKS
    (new asymmetric signing keys). Raises ApiError 401 on any failure.
    """
    settings = get_settings()
    try:
        if settings.supabase_jwt_secret is not None:
            return jwt.decode(
                token,
                settings.supabase_jwt_secret.get_secret_value(),
                algorithms=["HS256"],
                audience="authenticated",
            )
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError as exc:
        raise ApiError.unauthorized("TOKEN_EXPIRED", "Access token has expired.") from exc
    except jwt.PyJWTError as exc:
        raise ApiError.unauthorized() from exc


def profile_to_user(profile: dict[str, Any]) -> CurrentUser:
    department = profile.get("department") or {}
    return CurrentUser(
        id=profile["id"],
        full_name=profile["full_name"],
        email=profile["email"],
        role=profile["role"],
        department_id=profile.get("department_id"),
        department_name=department.get("name"),
        status=profile["status"],
    )


def fetch_profile(user_id: str) -> Optional[dict[str, Any]]:
    result = (
        get_service_client()
        .table("profiles")
        .select(PROFILE_SELECT)
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(_bearer)],
) -> CurrentUser:
    """FastAPI dependency: verified, active caller or 401/403."""
    if credentials is None:
        raise ApiError.unauthorized()
    claims = decode_token(credentials.credentials)
    profile = fetch_profile(claims["sub"])
    if profile is None:
        raise ApiError.unauthorized()
    if profile["status"] != "active":
        raise ApiError(403, "ACCOUNT_INACTIVE", "This account has been deactivated.")
    return profile_to_user(profile)
