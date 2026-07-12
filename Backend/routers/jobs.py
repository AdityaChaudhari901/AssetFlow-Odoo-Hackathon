"""Cron-triggered scans (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`).

Two jobs, both idempotent:
1. Overdue-return notifications (deduped per allocation while one is unread).
2. Booking reminders within the next 60 minutes (flagged via reminder_sent).
"""

from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import APIRouter, Header

from config.settings import get_settings
from core.errors import ApiError
from core.permissions import ADMIN, ASSET_MANAGER
from database.supabase import get_service_client
from services import notification_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _check_cron_auth(authorization: Optional[str]) -> None:
    secret = get_settings().cron_secret
    if secret is None:
        raise ApiError.forbidden("Cron secret is not configured.")
    if authorization != f"Bearer {secret.get_secret_value()}":
        raise ApiError.unauthorized()


def _scan_overdue_returns() -> int:
    client = get_service_client()
    overdue = (
        client.table("allocations")
        .select(
            "id, employee_id, expected_return_date, "
            "asset:assets!allocations_asset_id_fkey(asset_tag, name)"
        )
        .eq("status", "active")
        .lt("expected_return_date", date.today().isoformat())
        .execute()
    )
    created = 0
    for allocation in overdue.data:
        # Dedupe: skip while an unread overdue notification for this allocation exists.
        existing = (
            client.table("notifications")
            .select("id", count="exact")
            .eq("type", "overdue_return")
            .eq("entity_id", allocation["id"])
            .eq("is_read", False)
            .limit(1)
            .execute()
        )
        if existing.count:
            continue
        asset = allocation.get("asset") or {}
        label = f"{asset.get('name', 'Asset')} ({asset.get('asset_tag', '?')})"
        message = f"{label} was due back on {allocation['expected_return_date']}."
        if allocation.get("employee_id"):
            notification_service.notify(
                [allocation["employee_id"]], "overdue_return", "Overdue return",
                message, "allocation", allocation["id"],
            )
        notification_service.notify_roles(
            [ADMIN, ASSET_MANAGER], "overdue_return", "Overdue return",
            message, "allocation", allocation["id"],
            exclude_user_id=allocation.get("employee_id"),
        )
        created += 1
    return created


def _scan_booking_reminders() -> int:
    client = get_service_client()
    now = datetime.now(timezone.utc)
    soon = now + timedelta(minutes=60)
    upcoming = (
        client.table("bookings")
        .select(
            "id, booked_by, start_time, "
            "asset:assets!bookings_asset_id_fkey(asset_tag, name)"
        )
        .eq("status", "confirmed")
        .eq("reminder_sent", False)
        .gt("start_time", now.isoformat())
        .lte("start_time", soon.isoformat())
        .execute()
    )
    for booking in upcoming.data:
        asset = booking.get("asset") or {}
        notification_service.notify(
            [booking["booked_by"]], "booking_reminder", "Booking starts soon",
            f"Your booking for {asset.get('name', 'a resource')} starts at {booking['start_time']}.",
            "booking", booking["id"],
        )
        client.table("bookings").update({"reminder_sent": True}).eq("id", booking["id"]).execute()
    return len(upcoming.data)


@router.get("/scan")
def scan(authorization: Annotated[Optional[str], Header()] = None) -> dict:
    _check_cron_auth(authorization)
    overdue = _scan_overdue_returns()
    reminders = _scan_booking_reminders()
    return {"data": {"overdue_notifications": overdue, "booking_reminders": reminders}}
