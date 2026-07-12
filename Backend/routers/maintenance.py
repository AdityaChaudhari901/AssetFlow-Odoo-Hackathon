"""Maintenance workflow endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from core.permissions import MANAGERS, require_roles
from schemas.maintenance import (
    MaintenanceAssign,
    MaintenanceCreate,
    MaintenanceReject,
    MaintenanceResolve,
)
from services import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]
ManagerUser = Annotated[CurrentUser, Depends(require_roles(*MANAGERS))]


@router.get("")
def list_requests(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    priority: Optional[str] = None,
    mine: bool = False,
) -> dict:
    return maintenance_service.list_requests(user, params, status, asset_id, priority, mine)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_request(user: AnyUser, payload: MaintenanceCreate) -> dict:
    return maintenance_service.create_request(user, payload)


@router.get("/{request_id}")
def get_request(user: AnyUser, request_id: str) -> dict:
    return maintenance_service.get_request(request_id)


@router.post("/{request_id}/approve")
def approve(user: ManagerUser, request_id: str) -> dict:
    """Asset flips to under_maintenance atomically with the approval."""
    return maintenance_service.approve(user, request_id)


@router.post("/{request_id}/reject")
def reject(user: ManagerUser, request_id: str, payload: MaintenanceReject) -> dict:
    return maintenance_service.reject(user, request_id, payload)


@router.post("/{request_id}/assign")
def assign(user: ManagerUser, request_id: str, payload: MaintenanceAssign) -> dict:
    return maintenance_service.assign(user, request_id, payload)


@router.post("/{request_id}/start")
def start(user: ManagerUser, request_id: str) -> dict:
    return maintenance_service.start(user, request_id)


@router.post("/{request_id}/resolve")
def resolve(user: ManagerUser, request_id: str, payload: MaintenanceResolve) -> dict:
    """Asset returns to allocated/available atomically with the resolution."""
    return maintenance_service.resolve(user, request_id, payload)
