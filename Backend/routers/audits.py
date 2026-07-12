"""Audit cycle endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from core.permissions import ADMIN, MANAGERS, require_roles
from schemas.audits import AuditCycleCreate, AuditRecordUpdate
from services import audit_service

router = APIRouter(prefix="/audits", tags=["Audits"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]


@router.get("")
def list_cycles(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    status: Optional[str] = None,
) -> dict:
    return audit_service.list_cycles(user, params, status)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_cycle(
    admin: Annotated[CurrentUser, Depends(require_roles(ADMIN))],
    payload: AuditCycleCreate,
) -> dict:
    """Creates the cycle and snapshots every in-scope asset as a pending record."""
    return audit_service.create_cycle(admin, payload)


@router.get("/{cycle_id}")
def get_cycle(user: AnyUser, cycle_id: str) -> dict:
    return audit_service.get_cycle_detail(user, cycle_id)


@router.post("/{cycle_id}/records")
def update_record(user: AnyUser, cycle_id: str, payload: AuditRecordUpdate) -> dict:
    """Assigned auditors mark one asset verified/missing/damaged."""
    return audit_service.update_record(user, cycle_id, payload)


@router.get("/{cycle_id}/discrepancies")
def discrepancies(user: AnyUser, cycle_id: str) -> dict:
    return audit_service.discrepancies(user, cycle_id)


@router.post("/{cycle_id}/close")
def close_cycle(
    user: Annotated[CurrentUser, Depends(require_roles(*MANAGERS))], cycle_id: str
) -> dict:
    """Locks the cycle; confirmed-missing assets flip to lost."""
    return audit_service.close_cycle(user, cycle_id)
