"""Asset registry endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from core.permissions import MANAGERS, require_roles
from schemas.assets import AssetCreate, AssetStatusChange, AssetUpdate
from services import asset_service

router = APIRouter(prefix="/assets", tags=["Assets"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]
ManagerUser = Annotated[CurrentUser, Depends(require_roles(*MANAGERS))]


@router.get("")
def list_assets(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    search: Optional[str] = None,
    category_id: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[str] = None,
    location: Optional[str] = None,
    is_bookable: Optional[bool] = None,
    sort: Optional[str] = None,
    order: Optional[str] = None,
) -> dict:
    return asset_service.list_assets(
        params, search, category_id, status, department_id, location, is_bookable, sort, order
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def create_asset(user: ManagerUser, payload: AssetCreate) -> dict:
    return asset_service.create_asset(user, payload)


@router.get("/{asset_id}")
def get_asset(user: AnyUser, asset_id: str) -> dict:
    return asset_service.get_asset(asset_id)


@router.patch("/{asset_id}")
def update_asset(user: ManagerUser, asset_id: str, payload: AssetUpdate) -> dict:
    return asset_service.update_asset(user, asset_id, payload)


@router.post("/{asset_id}/status")
def change_status(user: ManagerUser, asset_id: str, payload: AssetStatusChange) -> dict:
    """Manual lifecycle transitions only — workflows drive the rest."""
    return asset_service.change_status(user, asset_id, payload)


@router.get("/{asset_id}/history")
def get_history(user: AnyUser, asset_id: str) -> dict:
    return asset_service.get_history(asset_id)
