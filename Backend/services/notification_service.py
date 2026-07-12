"""Notifications + activity log: the two write-side helpers every service uses,
plus the read-side endpoints' logic."""

import logging
from typing import Any, Iterable, Optional

from core.auth import CurrentUser
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from database.supabase import get_service_client

logger = logging.getLogger(__name__)


# --------------------------------------------------------------------------
# Write side (called from other services; never raises into the request path)
# --------------------------------------------------------------------------

def notify(
    user_ids: Iterable[str],
    type_: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
) -> None:
    rows = [
        {
            "user_id": user_id,
            "type": type_,
            "title": title,
            "message": message,
            "entity_type": entity_type,
            "entity_id": entity_id,
        }
        for user_id in dict.fromkeys(user_ids)  # de-dupe, keep order
    ]
    if not rows:
        return
    try:
        get_service_client().table("notifications").insert(rows).execute()
    except Exception:  # pragma: no cover - notifications must never break the action
        logger.exception("Failed to insert notifications")


def notify_roles(
    roles: Iterable[str],
    type_: str,
    title: str,
    message: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    exclude_user_id: Optional[str] = None,
) -> None:
    """Notify every active user holding one of the given roles."""
    try:
        result = (
            get_service_client()
            .table("profiles")
            .select("id")
            .in_("role", list(roles))
            .eq("status", "active")
            .execute()
        )
        user_ids = [row["id"] for row in result.data if row["id"] != exclude_user_id]
        notify(user_ids, type_, title, message, entity_type, entity_id)
    except Exception:  # pragma: no cover
        logger.exception("Failed to notify roles %s", roles)


def log(
    actor_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    details: Optional[dict[str, Any]] = None,
) -> None:
    try:
        get_service_client().table("activity_logs").insert(
            {
                "actor_id": actor_id,
                "action": action,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "details": details or {},
            }
        ).execute()
    except Exception:  # pragma: no cover - logging must never break the action
        logger.exception("Failed to write activity log for %s", action)


# --------------------------------------------------------------------------
# Read side (/notifications endpoints)
# --------------------------------------------------------------------------

def list_notifications(
    user: CurrentUser, params: PageParams, unread_only: bool
) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("notifications")
        .select("*", count="exact")
        .eq("user_id", user.id)
        .order("created_at", desc=True)
    )
    if unread_only:
        query = query.eq("is_read", False)
    result = paged(query, params).execute()
    return list_response(result.data, params, result.count)


def unread_count(user: CurrentUser) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("notifications")
        .select("id", count="exact")
        .eq("user_id", user.id)
        .eq("is_read", False)
        .limit(1)
        .execute()
    )
    return {"data": {"count": result.count or 0}}


def mark_read(user: CurrentUser, notification_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Notification")
    return {"data": result.data[0]}


def mark_all_read(user: CurrentUser) -> dict[str, Any]:
    get_service_client().table("notifications").update({"is_read": True}).eq(
        "user_id", user.id
    ).eq("is_read", False).execute()
    return {"data": {"ok": True}}
