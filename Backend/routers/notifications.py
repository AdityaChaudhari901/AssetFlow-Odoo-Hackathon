"""Notification endpoints (always scoped to the caller)."""

from typing import Annotated

from fastapi import APIRouter, Depends

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]


@router.get("")
def list_notifications(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    unread_only: bool = False,
) -> dict:
    return notification_service.list_notifications(user, params, unread_only)


@router.get("/unread-count")
def unread_count(user: AnyUser) -> dict:
    return notification_service.unread_count(user)


@router.post("/{notification_id}/read")
def mark_read(user: AnyUser, notification_id: str) -> dict:
    return notification_service.mark_read(user, notification_id)


@router.post("/read-all")
def mark_all_read(user: AnyUser) -> dict:
    return notification_service.mark_all_read(user)
