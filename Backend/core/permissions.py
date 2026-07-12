"""Role constants and role-based access dependencies."""

from typing import Annotated, Callable

from fastapi import Depends

from core.auth import CurrentUser, get_current_user
from core.errors import ApiError

ADMIN = "admin"
ASSET_MANAGER = "asset_manager"
DEPARTMENT_HEAD = "department_head"
EMPLOYEE = "employee"

ALL_ROLES = (ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE)
MANAGERS = (ADMIN, ASSET_MANAGER)


def require_roles(*roles: str) -> Callable[..., CurrentUser]:
    """Dependency factory: allow only the given roles (403 otherwise)."""

    def dependency(
        user: Annotated[CurrentUser, Depends(get_current_user)],
    ) -> CurrentUser:
        if user.role not in roles:
            raise ApiError.forbidden()
        return user

    return dependency


def is_manager(user: CurrentUser) -> bool:
    return user.role in MANAGERS
