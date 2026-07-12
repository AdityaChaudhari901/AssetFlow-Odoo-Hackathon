"""Time-slot booking of shared resources. The DB exclusion constraint is the
overlap referee; this service turns its violations into helpful 409 payloads."""

from datetime import datetime, timezone
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from core.permissions import MANAGERS
from database.errors import EXCLUSION_VIOLATION, map_db_error
from database.supabase import get_service_client
from schemas.bookings import BookingCancel, BookingCreate, BookingReschedule
from services import notification_service

BOOKING_SELECT = (
    "*, "
    "asset:assets!bookings_asset_id_fkey(id, asset_tag, name, location), "
    "booked_by_user:profiles!bookings_booked_by_fkey(id, full_name), "
    "department:departments!bookings_department_id_fkey(id, name)"
)


def _display_status(row: dict[str, Any], now: Optional[datetime] = None) -> str:
    if row["status"] == "cancelled":
        return "cancelled"
    now = now or datetime.now(timezone.utc)
    start = datetime.fromisoformat(row["start_time"])
    end = datetime.fromisoformat(row["end_time"])
    if now < start:
        return "upcoming"
    if now < end:
        return "ongoing"
    return "completed"


def _with_display(row: dict[str, Any]) -> dict[str, Any]:
    row["display_status"] = _display_status(row)
    return row


def _get_booking(booking_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("bookings")
        .select(BOOKING_SELECT)
        .eq("id", booking_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Booking")
    return _with_display(result.data[0])


def _overlap_error(asset_id: str, start: datetime, end: datetime) -> ApiError:
    """Fetch the conflicting confirmed booking to build a useful 409 payload."""
    result = (
        get_service_client()
        .table("bookings")
        .select(BOOKING_SELECT)
        .eq("asset_id", asset_id)
        .eq("status", "confirmed")
        .lt("start_time", end.isoformat())
        .gt("end_time", start.isoformat())
        .order("start_time")
        .limit(1)
        .execute()
    )
    conflict = result.data[0] if result.data else None
    message = "The requested time slot overlaps an existing booking."
    details: dict[str, Any] = {"conflicting_booking": None}
    if conflict:
        booked_by = conflict.get("booked_by_user") or {}
        asset = conflict.get("asset") or {}
        message = (
            f"{asset.get('name', 'This resource')} is already booked in that window"
            f" by {booked_by.get('full_name', 'someone')}."
        )
        details["conflicting_booking"] = {
            "id": conflict["id"],
            "start_time": conflict["start_time"],
            "end_time": conflict["end_time"],
            "booked_by": booked_by,
        }
    return ApiError.conflict("BOOKING_OVERLAP", message, details)


def list_bookings(
    user: CurrentUser,
    params: PageParams,
    asset_id: Optional[str],
    from_: Optional[datetime],
    to: Optional[datetime],
    status: Optional[str],
    mine: bool,
) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("bookings")
        .select(BOOKING_SELECT, count="exact")
        .order("start_time")
    )
    if asset_id:
        query = query.eq("asset_id", asset_id)
    if mine:
        query = query.eq("booked_by", user.id)
    if status:
        query = query.eq("status", status)
    # Calendar-feed semantics: any booking overlapping [from, to).
    if from_:
        query = query.gt("end_time", from_.isoformat())
    if to:
        query = query.lt("start_time", to.isoformat())

    result = paged(query, params).execute()
    return list_response([_with_display(r) for r in result.data], params, result.count)


def create_booking(user: CurrentUser, payload: BookingCreate) -> dict[str, Any]:
    client = get_service_client()
    asset = (
        client.table("assets")
        .select("id, asset_tag, name, is_bookable")
        .eq("id", payload.asset_id)
        .limit(1)
        .execute()
    )
    if not asset.data:
        raise ApiError.not_found("Asset")
    if not asset.data[0]["is_bookable"]:
        raise ApiError.conflict("ASSET_NOT_AVAILABLE", "This asset is not a bookable resource.")
    if payload.start_time <= datetime.now(timezone.utc):
        raise ApiError(422, "VALIDATION_ERROR", "start_time must be in the future.")

    try:
        result = (
            client.table("bookings")
            .insert(
                {
                    "asset_id": payload.asset_id,
                    "booked_by": user.id,
                    "department_id": payload.department_id,
                    "start_time": payload.start_time.isoformat(),
                    "end_time": payload.end_time.isoformat(),
                    "purpose": payload.purpose,
                }
            )
            .execute()
        )
    except PostgrestError as exc:
        if exc.code == EXCLUSION_VIOLATION:
            raise _overlap_error(payload.asset_id, payload.start_time, payload.end_time) from exc
        raise map_db_error(exc) from exc

    booking = _get_booking(result.data[0]["id"])
    asset_row = asset.data[0]
    notification_service.notify(
        [user.id], "booking_confirmed", "Booking confirmed",
        f"{asset_row['name']} ({asset_row['asset_tag']}) is booked for you.",
        "booking", booking["id"],
    )
    notification_service.log(user.id, "booking.created", "booking", booking["id"],
                             {"asset_id": payload.asset_id})
    return {"data": booking}


def _check_owner_or_manager(user: CurrentUser, booking: dict[str, Any]) -> None:
    if booking["booked_by"] != user.id and user.role not in MANAGERS:
        raise ApiError.forbidden("Only the booking owner or an asset manager can do that.")


def reschedule(
    user: CurrentUser, booking_id: str, payload: BookingReschedule
) -> dict[str, Any]:
    booking = _get_booking(booking_id)
    _check_owner_or_manager(user, booking)
    if booking["status"] != "confirmed":
        raise ApiError.conflict("ALREADY_PROCESSED", "Cancelled bookings cannot be rescheduled.")

    try:
        get_service_client().table("bookings").update(
            {
                "start_time": payload.start_time.isoformat(),
                "end_time": payload.end_time.isoformat(),
            }
        ).eq("id", booking_id).execute()
    except PostgrestError as exc:
        if exc.code == EXCLUSION_VIOLATION:
            raise _overlap_error(booking["asset_id"], payload.start_time, payload.end_time) from exc
        raise map_db_error(exc) from exc

    notification_service.log(user.id, "booking.rescheduled", "booking", booking_id)
    return {"data": _get_booking(booking_id)}


def cancel(user: CurrentUser, booking_id: str, payload: BookingCancel) -> dict[str, Any]:
    booking = _get_booking(booking_id)
    _check_owner_or_manager(user, booking)
    if booking["status"] != "confirmed":
        raise ApiError.conflict("ALREADY_PROCESSED", "This booking is already cancelled.")

    get_service_client().table("bookings").update(
        {
            "status": "cancelled",
            "cancelled_at": datetime.now(timezone.utc).isoformat(),
            "cancelled_by": user.id,
            "cancel_reason": payload.reason,
        }
    ).eq("id", booking_id).execute()

    if booking["booked_by"] != user.id:
        notification_service.notify(
            [booking["booked_by"]], "booking_cancelled", "Booking cancelled",
            f"Your booking for {(booking.get('asset') or {}).get('name', 'a resource')} was cancelled.",
            "booking", booking_id,
        )
    notification_service.log(user.id, "booking.cancelled", "booking", booking_id,
                             {"reason": payload.reason})
    return {"data": _get_booking(booking_id)}
