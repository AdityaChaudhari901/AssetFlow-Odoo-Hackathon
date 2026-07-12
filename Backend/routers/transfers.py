"""Transfer request endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, status

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from schemas.allocations import ReviewNotes, TransferCreate
from services import allocation_service

router = APIRouter(prefix="/transfers", tags=["Transfers"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]


@router.get("")
def list_transfers(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    mine: bool = False,
) -> dict:
    return allocation_service.list_transfers(user, params, status, asset_id, mine)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_transfer(user: AnyUser, payload: TransferCreate) -> dict:
    return allocation_service.create_transfer(user, payload)


@router.post("/{transfer_id}/approve")
def approve_transfer(
    user: AnyUser, transfer_id: str, payload: Optional[ReviewNotes] = None
) -> dict:
    """Atomically re-allocates; permission is checked per role/department in the service."""
    return allocation_service.approve_transfer(
        user, transfer_id, payload.reason if payload else None
    )


@router.post("/{transfer_id}/reject")
def reject_transfer(
    user: AnyUser, transfer_id: str, payload: Optional[ReviewNotes] = None
) -> dict:
    return allocation_service.reject_transfer(
        user, transfer_id, payload.reason if payload else None
    )
