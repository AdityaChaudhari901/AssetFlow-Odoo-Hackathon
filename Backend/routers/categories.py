"""Asset category endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.permissions import ADMIN, require_roles
from schemas.categories import CategoryCreate, CategoryUpdate
from services import org_service

router = APIRouter(prefix="/categories", tags=["Categories"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]
AdminUser = Annotated[CurrentUser, Depends(require_roles(ADMIN))]


@router.get("")
def list_categories(user: AnyUser, status: Optional[str] = None) -> dict:
    return org_service.list_categories(status)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_category(admin: AdminUser, payload: CategoryCreate) -> dict:
    return org_service.create_category(admin, payload)


@router.patch("/{category_id}")
def update_category(admin: AdminUser, category_id: str, payload: CategoryUpdate) -> dict:
    return org_service.update_category(admin, category_id, payload)
