"""Employee directory endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends

from core.auth import CurrentUser
from core.pagination import PageParams, page_params
from core.permissions import ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, require_roles
from schemas.employees import EmployeeUpdate
from services import employee_service

router = APIRouter(prefix="/employees", tags=["Employees"])

DirectoryUser = Annotated[
    CurrentUser, Depends(require_roles(ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD))
]


@router.get("")
def list_employees(
    user: DirectoryUser,
    params: Annotated[PageParams, Depends(page_params)],
    search: Optional[str] = None,
    department_id: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
) -> dict:
    return employee_service.list_employees(user, params, search, department_id, role, status)


@router.get("/{employee_id}")
def get_employee(user: DirectoryUser, employee_id: str) -> dict:
    return employee_service.get_employee(employee_id)


@router.patch("/{employee_id}")
def update_employee(
    admin: Annotated[CurrentUser, Depends(require_roles(ADMIN))],
    employee_id: str,
    payload: EmployeeUpdate,
) -> dict:
    """Admin-only. The single place where roles are assigned/changed."""
    return employee_service.update_employee(admin, employee_id, payload)
