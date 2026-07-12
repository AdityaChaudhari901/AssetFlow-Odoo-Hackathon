"""Allocation and return endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from core.permissions import MANAGERS, require_roles
from schemas.allocations import AllocationCreate, AllocationReturn
from services import allocation_service

router = APIRouter(prefix="/allocations", tags=["Allocations"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]
ManagerUser = Annotated[CurrentUser, Depends(require_roles(*MANAGERS))]


@router.get("")
def list_allocations(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    status: Optional[str] = None,
    employee_id: Optional[str] = None,
    department_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    mine: bool = False,
) -> dict:
    return allocation_service.list_allocations(
        user, params, status, employee_id, department_id, asset_id, mine
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def allocate(user: ManagerUser, payload: AllocationCreate) -> dict:
    """Allocate an available asset. 409 ASSET_ALREADY_ALLOCATED carries the holder."""
    return allocation_service.allocate(user, payload)


@router.post("/{allocation_id}/return-request")
def request_return(user: AnyUser, allocation_id: str) -> dict:
    return allocation_service.request_return(user, allocation_id)


@router.post("/{allocation_id}/return")
def return_asset(user: ManagerUser, allocation_id: str, payload: AllocationReturn) -> dict:
    return allocation_service.return_asset(user, allocation_id, payload)
