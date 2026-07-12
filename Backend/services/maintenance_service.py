"""Maintenance workflow: pending → approved/rejected → assigned → in_progress → resolved.

Approve and resolve also flip the asset's status, so they run as RPCs; the
other transitions are single-row updates guarded by the state machine below."""

from datetime import datetime, timezone
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from core.permissions import ADMIN, ASSET_MANAGER, EMPLOYEE
from database.errors import map_db_error
from database.supabase import get_service_client
from schemas.maintenance import (
    MaintenanceAssign,
    MaintenanceCreate,
    MaintenanceReject,
    MaintenanceResolve,
)
from services import notification_service

MAINTENANCE_SELECT = (
    "*, "
    "asset:assets!maintenance_requests_asset_id_fkey(id, asset_tag, name, status), "
    "raised_by_user:profiles!maintenance_requests_raised_by_fkey(id, full_name), "
    "reviewed_by_user:profiles!maintenance_requests_reviewed_by_fkey(id, full_name)"
)

# action -> required current status
TRANSITIONS = {
    "approve": "pending",
    "reject": "pending",
    "assign": "approved",
    "start": "assigned",
    "resolve": "in_progress",
}


def _get_request(request_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("maintenance_requests")
        .select(MAINTENANCE_SELECT)
        .eq("id", request_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Maintenance request")
    return result.data[0]


def _guard(request: dict[str, Any], action: str) -> None:
    required = TRANSITIONS[action]
    if request["status"] != required:
        raise ApiError.conflict(
            "INVALID_STATUS_TRANSITION",
            f"Cannot {action} a request in status '{request['status']}'.",
            details={"from": request["status"], "action": action, "required": required},
        )


def _asset_label(request: dict[str, Any]) -> str:
    asset = request.get("asset") or {}
    return f"{asset.get('name', 'Asset')} ({asset.get('asset_tag', '?')})"


def _notify_requester(request: dict[str, Any], type_: str, title: str, message: str) -> None:
    notification_service.notify(
        [request["raised_by"]], type_, title, message, "maintenance", request["id"]
    )


def list_requests(
    user: CurrentUser,
    params: PageParams,
    status: Optional[str],
    asset_id: Optional[str],
    priority: Optional[str],
    mine: bool,
) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("maintenance_requests")
        .select(MAINTENANCE_SELECT, count="exact")
        .order("created_at", desc=True)
    )
    if mine or user.role == EMPLOYEE:
        query = query.eq("raised_by", user.id)
    if status:
        query = query.eq("status", status)
    if asset_id:
        query = query.eq("asset_id", asset_id)
    if priority:
        query = query.eq("priority", priority)
    result = paged(query, params).execute()
    return list_response(result.data, params, result.count)


def get_request(request_id: str) -> dict[str, Any]:
    return {"data": _get_request(request_id)}


def create_request(user: CurrentUser, payload: MaintenanceCreate) -> dict[str, Any]:
    asset = (
        get_service_client().table("assets").select("id, asset_tag, name")
        .eq("id", payload.asset_id).limit(1).execute()
    )
    if not asset.data:
        raise ApiError.not_found("Asset")

    result = (
        get_service_client()
        .table("maintenance_requests")
        .insert({**payload.model_dump(), "raised_by": user.id})
        .execute()
    )
    request = _get_request(result.data[0]["id"])
    notification_service.notify_roles(
        [ADMIN, ASSET_MANAGER], "maintenance_requested", "Maintenance requested",
        f"{user.full_name} reported: {payload.title} — {_asset_label(request)}.",
        "maintenance", request["id"], exclude_user_id=user.id,
    )
    notification_service.log(user.id, "maintenance.requested", "maintenance", request["id"],
                             {"asset_id": payload.asset_id, "priority": payload.priority})
    return {"data": request}


def approve(user: CurrentUser, request_id: str) -> dict[str, Any]:
    try:
        get_service_client().rpc(
            "approve_maintenance",
            {"p_request_id": request_id, "p_reviewer": user.id, "p_notes": None},
        ).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    request = _get_request(request_id)
    _notify_requester(
        request, "maintenance_approved", "Maintenance approved",
        f"Your request for {_asset_label(request)} was approved — asset is now under maintenance.",
    )
    notification_service.log(user.id, "maintenance.approved", "maintenance", request_id)
    return {"data": request}


def reject(user: CurrentUser, request_id: str, payload: MaintenanceReject) -> dict[str, Any]:
    request = _get_request(request_id)
    _guard(request, "reject")
    get_service_client().table("maintenance_requests").update(
        {
            "status": "rejected",
            "reviewed_by": user.id,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "review_notes": payload.reason,
        }
    ).eq("id", request_id).eq("status", "pending").execute()
    request = _get_request(request_id)
    _notify_requester(
        request, "maintenance_rejected", "Maintenance rejected",
        f"Your request for {_asset_label(request)} was rejected: {payload.reason}",
    )
    notification_service.log(user.id, "maintenance.rejected", "maintenance", request_id,
                             {"reason": payload.reason})
    return {"data": request}


def assign(user: CurrentUser, request_id: str, payload: MaintenanceAssign) -> dict[str, Any]:
    request = _get_request(request_id)
    _guard(request, "assign")
    get_service_client().table("maintenance_requests").update(
        {
            "status": "assigned",
            "technician_name": payload.technician_name,
            "assigned_at": datetime.now(timezone.utc).isoformat(),
        }
    ).eq("id", request_id).eq("status", "approved").execute()
    notification_service.log(user.id, "maintenance.assigned", "maintenance", request_id,
                             {"technician_name": payload.technician_name})
    return {"data": _get_request(request_id)}


def start(user: CurrentUser, request_id: str) -> dict[str, Any]:
    request = _get_request(request_id)
    _guard(request, "start")
    get_service_client().table("maintenance_requests").update(
        {"status": "in_progress", "started_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", request_id).eq("status", "assigned").execute()
    notification_service.log(user.id, "maintenance.started", "maintenance", request_id)
    return {"data": _get_request(request_id)}


def resolve(user: CurrentUser, request_id: str, payload: MaintenanceResolve) -> dict[str, Any]:
    try:
        get_service_client().rpc(
            "resolve_maintenance",
            {
                "p_request_id": request_id,
                "p_notes": payload.resolution_notes,
                "p_cost": payload.cost,
            },
        ).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    request = _get_request(request_id)
    _notify_requester(
        request, "maintenance_resolved", "Maintenance resolved",
        f"{_asset_label(request)} is fixed and back in service.",
    )
    notification_service.log(user.id, "maintenance.resolved", "maintenance", request_id)
    return {"data": request}
