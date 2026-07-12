"""Department endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.permissions import ADMIN, require_roles
from schemas.departments import DepartmentCreate, DepartmentUpdate
from services import org_service

router = APIRouter(prefix="/departments", tags=["Departments"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]
AdminUser = Annotated[CurrentUser, Depends(require_roles(ADMIN))]


@router.get("")
def list_departments(
    user: AnyUser,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> dict:
    return org_service.list_departments(status, search)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_department(admin: AdminUser, payload: DepartmentCreate) -> dict:
    return org_service.create_department(admin, payload)


@router.get("/{department_id}")
def get_department(user: AnyUser, department_id: str) -> dict:
    return org_service.get_department(department_id)


@router.patch("/{department_id}")
def update_department(
    admin: AdminUser, department_id: str, payload: DepartmentUpdate
) -> dict:
    return org_service.update_department(admin, department_id, payload)
