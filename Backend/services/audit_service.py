"""Audit cycles: create/snapshot, record results, discrepancy report, close."""

from collections import Counter
from datetime import datetime, timezone
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from core.permissions import ADMIN, ASSET_MANAGER, MANAGERS
from database.errors import map_db_error
from database.supabase import get_service_client
from schemas.audits import AuditCycleCreate, AuditRecordUpdate
from services import notification_service

CYCLE_SELECT = (
    "*, "
    "department:departments!audit_cycles_department_id_fkey(id, name), "
    "created_by_user:profiles!audit_cycles_created_by_fkey(id, full_name), "
    "auditors:audit_auditors(auditor:profiles!audit_auditors_auditor_id_fkey(id, full_name))"
)

RECORD_SELECT = (
    "id, cycle_id, result, notes, audited_at, "
    "asset:assets!audit_records_asset_id_fkey(id, asset_tag, name, location, status), "
    "audited_by_user:profiles!audit_records_audited_by_fkey(id, full_name)"
)


def _flatten_auditors(cycle: dict[str, Any]) -> dict[str, Any]:
    cycle["auditors"] = [entry["auditor"] for entry in cycle.get("auditors", []) if entry.get("auditor")]
    return cycle


def _serialize_record(row: dict[str, Any]) -> dict[str, Any]:
    """Response shape: audited_by as a user object (frontend renders a UserChip)."""
    row = dict(row)
    row["audited_by"] = row.pop("audited_by_user", None)
    return row


def _get_cycle(cycle_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("audit_cycles")
        .select(CYCLE_SELECT)
        .eq("id", cycle_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Audit cycle")
    return _flatten_auditors(result.data[0])


def _progress(cycle_id: str) -> dict[str, int]:
    records = (
        get_service_client()
        .table("audit_records")
        .select("result")
        .eq("cycle_id", cycle_id)
        .execute()
    )
    counts = Counter(row["result"] for row in records.data)
    return {
        "total": len(records.data),
        "verified": counts.get("verified", 0),
        "missing": counts.get("missing", 0),
        "damaged": counts.get("damaged", 0),
        "pending": counts.get("pending", 0),
    }


def _is_auditor(cycle: dict[str, Any], user_id: str) -> bool:
    return any(a["id"] == user_id for a in cycle.get("auditors", []))


def _check_view_permission(user: CurrentUser, cycle: dict[str, Any]) -> None:
    if user.role in MANAGERS or _is_auditor(cycle, user.id):
        return
    raise ApiError.forbidden()


def list_cycles(user: CurrentUser, params: PageParams, status: Optional[str]) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("audit_cycles")
        .select(CYCLE_SELECT, count="exact")
        .order("created_at", desc=True)
    )
    if status:
        query = query.eq("status", status)
    result = paged(query, params).execute()
    cycles = [_flatten_auditors(row) for row in result.data]
    # Non-managers only see cycles they audit.
    if user.role not in MANAGERS:
        cycles = [c for c in cycles if _is_auditor(c, user.id)]
    for cycle in cycles:
        cycle["progress"] = _progress(cycle["id"])
    return list_response(cycles, params, result.count)


def create_cycle(admin: CurrentUser, payload: AuditCycleCreate) -> dict[str, Any]:
    client = get_service_client()
    cycle_result = (
        client.table("audit_cycles")
        .insert(
            {
                "name": payload.name,
                "department_id": payload.department_id,
                "location": payload.location,
                "start_date": payload.start_date.isoformat(),
                "end_date": payload.end_date.isoformat(),
                "created_by": admin.id,
            }
        )
        .execute()
    )
    cycle = cycle_result.data[0]

    try:
        client.table("audit_auditors").insert(
            [{"cycle_id": cycle["id"], "auditor_id": auditor_id}
             for auditor_id in dict.fromkeys(payload.auditor_ids)]
        ).execute()

        # Snapshot every in-scope asset as a pending record.
        assets_query = client.table("assets").select("id").neq("status", "disposed")
        if payload.department_id:
            assets_query = assets_query.eq("department_id", payload.department_id)
        if payload.location:
            assets_query = assets_query.ilike("location", f"%{payload.location}%")
        assets = assets_query.execute()
        if assets.data:
            client.table("audit_records").insert(
                [{"cycle_id": cycle["id"], "asset_id": row["id"]} for row in assets.data]
            ).execute()
    except PostgrestError as exc:
        # Roll back the half-created cycle so a bad auditor id doesn't leave junk.
        client.table("audit_cycles").delete().eq("id", cycle["id"]).execute()
        raise map_db_error(exc) from exc

    notification_service.notify(
        payload.auditor_ids, "audit_assigned", "Audit assigned to you",
        f"You are an auditor on '{payload.name}'.", "audit", cycle["id"],
    )
    notification_service.log(admin.id, "audit.created", "audit", cycle["id"],
                             {"name": payload.name, "asset_count": len(assets.data)})
    return get_cycle_detail(admin, cycle["id"])


def get_cycle_detail(user: CurrentUser, cycle_id: str) -> dict[str, Any]:
    cycle = _get_cycle(cycle_id)
    _check_view_permission(user, cycle)
    records = (
        get_service_client()
        .table("audit_records")
        .select(RECORD_SELECT)
        .eq("cycle_id", cycle_id)
        .order("audited_at", desc=True)
        .execute()
    )
    cycle["progress"] = _progress(cycle_id)
    cycle["records"] = [_serialize_record(row) for row in records.data]
    return {"data": cycle}


def update_record(user: CurrentUser, cycle_id: str, payload: AuditRecordUpdate) -> dict[str, Any]:
    cycle = _get_cycle(cycle_id)
    if cycle["status"] == "closed":
        raise ApiError.conflict("AUDIT_CYCLE_CLOSED", "This audit cycle is closed.")
    if not _is_auditor(cycle, user.id):
        raise ApiError.forbidden("Only assigned auditors can record results.")

    result = (
        get_service_client()
        .table("audit_records")
        .update(
            {
                "result": payload.result,
                "notes": payload.notes,
                "audited_by": user.id,
                "audited_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("cycle_id", cycle_id)
        .eq("asset_id", payload.asset_id)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Audit record (asset is not in this cycle's scope)")
    notification_service.log(user.id, "audit.record_updated", "audit", cycle_id,
                             {"asset_id": payload.asset_id, "result": payload.result})
    refreshed = (
        get_service_client()
        .table("audit_records")
        .select(RECORD_SELECT)
        .eq("id", result.data[0]["id"])
        .limit(1)
        .execute()
    )
    return {"data": _serialize_record(refreshed.data[0])}


def discrepancies(user: CurrentUser, cycle_id: str) -> dict[str, Any]:
    cycle = _get_cycle(cycle_id)
    _check_view_permission(user, cycle)
    records = (
        get_service_client()
        .table("audit_records")
        .select(RECORD_SELECT)
        .eq("cycle_id", cycle_id)
        .in_("result", ["missing", "damaged"])
        .execute()
    )
    return {"data": [_serialize_record(row) for row in records.data]}


def close_cycle(user: CurrentUser, cycle_id: str) -> dict[str, Any]:
    try:
        result = get_service_client().rpc(
            "close_audit_cycle", {"p_cycle_id": cycle_id, "p_actor": user.id}
        ).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc

    summary = result.data
    flagged = (summary.get("missing", 0) or 0) + (summary.get("damaged", 0) or 0)
    if flagged:
        cycle = _get_cycle(cycle_id)
        notification_service.notify_roles(
            [ADMIN, ASSET_MANAGER], "audit_discrepancy", "Audit discrepancies flagged",
            f"'{cycle['name']}' closed with {summary.get('missing', 0)} missing and "
            f"{summary.get('damaged', 0)} damaged assets.",
            "audit", cycle_id,
        )
    notification_service.log(user.id, "audit.closed", "audit", cycle_id, summary)
    return {"data": {"summary": summary}}
