"""Asset registry: CRUD, manual lifecycle transitions, per-asset history."""

from datetime import date
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from database.errors import map_db_error
from database.supabase import get_service_client
from schemas.assets import AssetCreate, AssetStatusChange, AssetUpdate
from services import notification_service

ASSET_SELECT = (
    "*, "
    "category:asset_categories!assets_category_id_fkey(id, name), "
    "department:departments!assets_department_id_fkey(id, name)"
)

ALLOCATION_HISTORY_SELECT = (
    "id, allocated_at, expected_return_date, status, returned_at, return_condition, "
    "return_notes, notes, return_requested, "
    "employee:profiles!allocations_employee_id_fkey(id, full_name), "
    "department:departments!allocations_department_id_fkey(id, name), "
    "allocated_by:profiles!allocations_allocated_by_fkey(id, full_name)"
)

# Manual transitions only; everything else moves through workflows.
MANUAL_TRANSITIONS: dict[str, set[str]] = {
    "available": {"reserved", "lost", "retired", "disposed"},
    "reserved": {"available"},
    "lost": {"available"},
    "retired": {"disposed"},
}


def _fetch_asset(asset_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("assets")
        .select(ASSET_SELECT)
        .eq("id", asset_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Asset")
    return result.data[0]


def _active_allocation(asset_id: str) -> Optional[dict[str, Any]]:
    result = (
        get_service_client()
        .table("allocations")
        .select(ALLOCATION_HISTORY_SELECT)
        .eq("asset_id", asset_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    allocation = result.data[0]
    due = allocation.get("expected_return_date")
    allocation["is_overdue"] = bool(due) and date.fromisoformat(due) < date.today()
    return allocation


def list_assets(
    params: PageParams,
    search: Optional[str],
    category_id: Optional[str],
    status: Optional[str],
    department_id: Optional[str],
    location: Optional[str],
    is_bookable: Optional[bool],
    sort: Optional[str],
    order: Optional[str],
) -> dict[str, Any]:
    query = get_service_client().table("assets").select(ASSET_SELECT, count="exact")
    if search:
        term = search.replace(",", " ").strip()
        query = query.or_(
            f"name.ilike.%{term}%,asset_tag.ilike.%{term}%,serial_number.ilike.%{term}%"
        )
    if category_id:
        query = query.eq("category_id", category_id)
    if status:
        query = query.eq("status", status)
    if department_id:
        query = query.eq("department_id", department_id)
    if location:
        query = query.ilike("location", f"%{location}%")
    if is_bookable is not None:
        query = query.eq("is_bookable", is_bookable)

    sort_column = sort if sort in {"name", "asset_tag", "created_at", "status", "acquisition_date"} else "created_at"
    query = query.order(sort_column, desc=(order != "asc"))
    result = paged(query, params).execute()
    return list_response(result.data, params, result.count)


def create_asset(user: CurrentUser, payload: AssetCreate) -> dict[str, Any]:
    body = payload.model_dump(mode="json")
    body["created_by"] = user.id
    try:
        result = get_service_client().table("assets").insert(body).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    asset = result.data[0]
    notification_service.log(
        user.id, "asset.created", "asset", asset["id"],
        {"asset_tag": asset["asset_tag"], "name": asset["name"]},
    )
    return {"data": _fetch_asset(asset["id"])}


def get_asset(asset_id: str) -> dict[str, Any]:
    asset = _fetch_asset(asset_id)
    asset["current_allocation"] = _active_allocation(asset_id)
    open_maintenance = (
        get_service_client()
        .table("maintenance_requests")
        .select("id", count="exact")
        .eq("asset_id", asset_id)
        .in_("status", ["pending", "approved", "assigned", "in_progress"])
        .limit(1)
        .execute()
    )
    asset["open_maintenance_count"] = open_maintenance.count or 0
    return {"data": asset}


def update_asset(user: CurrentUser, asset_id: str, payload: AssetUpdate) -> dict[str, Any]:
    updates = payload.model_dump(mode="json", exclude_unset=True)
    if not updates:
        return {"data": _fetch_asset(asset_id)}
    try:
        result = get_service_client().table("assets").update(updates).eq("id", asset_id).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    if not result.data:
        raise ApiError.not_found("Asset")
    notification_service.log(user.id, "asset.updated", "asset", asset_id,
                             {"fields": sorted(updates)})
    return {"data": _fetch_asset(asset_id)}


def change_status(
    user: CurrentUser, asset_id: str, payload: AssetStatusChange
) -> dict[str, Any]:
    asset = _fetch_asset(asset_id)
    allowed = MANUAL_TRANSITIONS.get(asset["status"], set())
    if payload.status not in allowed:
        raise ApiError.conflict(
            "INVALID_STATUS_TRANSITION",
            f"Cannot move this asset from '{asset['status']}' to '{payload.status}' manually.",
            details={"from": asset["status"], "to": payload.status, "allowed": sorted(allowed)},
        )
    get_service_client().table("assets").update({"status": payload.status}).eq(
        "id", asset_id
    ).execute()
    notification_service.log(
        user.id, "asset.status_changed", "asset", asset_id,
        {"from": asset["status"], "to": payload.status, "notes": payload.notes},
    )
    return {"data": _fetch_asset(asset_id)}


def get_history(asset_id: str) -> dict[str, Any]:
    client = get_service_client()
    _fetch_asset(asset_id)  # 404 guard

    allocations = (
        client.table("allocations")
        .select(ALLOCATION_HISTORY_SELECT)
        .eq("asset_id", asset_id)
        .order("allocated_at", desc=True)
        .execute()
    )
    maintenance = (
        client.table("maintenance_requests")
        .select(
            "id, title, priority, status, created_at, resolved_at, technician_name, "
            "raised_by:profiles!maintenance_requests_raised_by_fkey(id, full_name)"
        )
        .eq("asset_id", asset_id)
        .order("created_at", desc=True)
        .execute()
    )
    audits = (
        client.table("audit_records")
        .select(
            "cycle_id, result, notes, audited_at, "
            "cycle:audit_cycles!audit_records_cycle_id_fkey(id, name, status), "
            "audited_by:profiles!audit_records_audited_by_fkey(id, full_name)"
        )
        .eq("asset_id", asset_id)
        .order("audited_at", desc=True)
        .execute()
    )
    audit_rows = [
        {
            "cycle_id": row["cycle_id"],
            "cycle_name": (row.get("cycle") or {}).get("name"),
            "cycle_status": (row.get("cycle") or {}).get("status"),
            "result": row["result"],
            "notes": row["notes"],
            "audited_at": row["audited_at"],
            "audited_by": row.get("audited_by"),
        }
        for row in audits.data
    ]
    return {
        "data": {
            "allocations": allocations.data,
            "maintenance": maintenance.data,
            "audits": audit_rows,
        }
    }
