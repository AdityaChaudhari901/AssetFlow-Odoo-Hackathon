"""Resource booking endpoints."""

from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from schemas.bookings import BookingCancel, BookingCreate, BookingReschedule
from services import booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]


@router.get("")
def list_bookings(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    asset_id: Optional[str] = None,
    from_: Annotated[Optional[datetime], Query(alias="from")] = None,
    to: Optional[datetime] = None,
    status: Optional[str] = None,
    mine: bool = False,
) -> dict:
    return booking_service.list_bookings(user, params, asset_id, from_, to, status, mine)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(user: AnyUser, payload: BookingCreate) -> dict:
    """Book a bookable asset. 409 BOOKING_OVERLAP carries the conflicting booking."""
    return booking_service.create_booking(user, payload)


@router.patch("/{booking_id}")
def reschedule_booking(user: AnyUser, booking_id: str, payload: BookingReschedule) -> dict:
    return booking_service.reschedule(user, booking_id, payload)


@router.post("/{booking_id}/cancel")
def cancel_booking(
    user: AnyUser, booking_id: str, payload: Optional[BookingCancel] = None
) -> dict:
    return booking_service.cancel(user, booking_id, payload or BookingCancel())
