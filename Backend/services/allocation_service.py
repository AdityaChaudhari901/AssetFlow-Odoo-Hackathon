"""Allocations, returns and transfers — the conflict-rule heart of AssetFlow."""

from datetime import date, datetime, timezone
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from core.permissions import ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE, MANAGERS
from database.errors import UNIQUE_VIOLATION, map_db_error, rpc_error_code
from database.supabase import get_service_client
from schemas.allocations import AllocationCreate, AllocationReturn, TransferCreate
from services import notification_service
from services.serializers import holder_of

ALLOCATION_SELECT = (
    "*, "
    "asset:assets!allocations_asset_id_fkey(id, asset_tag, name, status), "
    "employee:profiles!allocations_employee_id_fkey(id, full_name, avatar_url, "
    "department:departments!profiles_department_id_fkey(id, name)), "
    "department:departments!allocations_department_id_fkey(id, name), "
    "allocated_by_user:profiles!allocations_allocated_by_fkey(id, full_name)"
)

TRANSFER_SELECT = (
    "*, "
    "asset:assets!transfer_requests_asset_id_fkey(id, asset_tag, name, status), "
    "from_allocation:allocations!transfer_requests_from_allocation_id_fkey(id, "
    "employee:profiles!allocations_employee_id_fkey(id, full_name), "
    "department:departments!allocations_department_id_fkey(id, name)), "
    "requested_by_user:profiles!transfer_requests_requested_by_fkey(id, full_name), "
    "to_employee:profiles!transfer_requests_to_employee_id_fkey(id, full_name, department_id), "
    "to_department:departments!transfer_requests_to_department_id_fkey(id, name), "
    "reviewed_by_user:profiles!transfer_requests_reviewed_by_fkey(id, full_name)"
)


def _with_overdue(row: dict[str, Any]) -> dict[str, Any]:
    due = row.get("expected_return_date")
    row["is_overdue"] = (
        row.get("status") == "active" and bool(due) and date.fromisoformat(due) < date.today()
    )
    return row


def _allowed_actions(row: dict[str, Any], user: Optional[CurrentUser]) -> list[str]:
    """Per-caller action hints the frontend uses to render buttons."""
    if user is None or row.get("status") != "active":
        return []
    is_manager = user.role in MANAGERS
    employee = row.get("employee") or {}
    is_holder = employee.get("id") == user.id or (
        row.get("department_id") is not None
        and row["department_id"] == user.department_id
        and user.role == DEPARTMENT_HEAD
    )
    actions = []
    if is_holder and not row.get("return_requested"):
        actions.append("request_return")
    if is_holder or is_manager:
        actions.append("request_transfer")
    if is_manager:
        actions.append("check_in")
    return actions


def enrich_allocation(
    row: dict[str, Any], user: Optional[CurrentUser] = None
) -> dict[str, Any]:
    """Shape an allocation row for API responses: holder, overdue math, actions."""
    row = dict(row)
    _with_overdue(row)
    due = row.get("expected_return_date")
    row["days_overdue"] = (
        max(0, (date.today() - date.fromisoformat(due)).days)
        if due and row.get("status") == "active"
        else 0
    )
    holder_type, holder = holder_of(row)
    row["holder_type"] = holder_type
    row["holder"] = holder or {"id": None, "name": "Unassigned", "department_name": None}
    row["allowed_actions"] = _allowed_actions(row, user)
    return row


def _get_allocation(allocation_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("allocations")
        .select(ALLOCATION_SELECT)
        .eq("id", allocation_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Allocation")
    return _with_overdue(result.data[0])


def _active_allocation_for_asset(asset_id: str) -> Optional[dict[str, Any]]:
    result = (
        get_service_client()
        .table("allocations")
        .select(ALLOCATION_SELECT)
        .eq("asset_id", asset_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    return _with_overdue(result.data[0]) if result.data else None


def _holder_summary(allocation: dict[str, Any]) -> dict[str, Any]:
    if allocation.get("employee"):
        return {"type": "employee", **allocation["employee"]}
    department = allocation.get("department") or {}
    return {"type": "department", **department}


def _already_allocated_error(allocation: dict[str, Any]) -> ApiError:
    holder = _holder_summary(allocation)
    return ApiError.conflict(
        "ASSET_ALREADY_ALLOCATED",
        f"This asset is currently held by {holder.get('full_name') or holder.get('name')}.",
        details={
            "current_holder": {"type": holder["type"], "id": holder.get("id"),
                                "name": holder.get("full_name") or holder.get("name")},
            "allocation_id": allocation["id"],
            "allocated_at": allocation["allocated_at"],
            "expected_return_date": allocation.get("expected_return_date"),
        },
    )


def _notify_new_holder(allocation: dict[str, Any], asset_label: str) -> None:
    if allocation.get("employee_id"):
        notification_service.notify(
            [allocation["employee_id"]], "asset_assigned", "Asset assigned to you",
            f"{asset_label} has been allocated to you.", "allocation", allocation["id"],
        )
    elif allocation.get("department_id"):
        head = (
            get_service_client()
            .table("departments")
            .select("head_id")
            .eq("id", allocation["department_id"])
            .limit(1)
            .execute()
        )
        head_id = head.data[0]["head_id"] if head.data else None
        if head_id:
            notification_service.notify(
                [head_id], "asset_assigned", "Asset assigned to your department",
                f"{asset_label} has been allocated to your department.",
                "allocation", allocation["id"],
            )


def _asset_label(asset_id: str) -> str:
    result = (
        get_service_client().table("assets").select("asset_tag, name").eq("id", asset_id)
        .limit(1).execute()
    )
    if not result.data:
        return "Asset"
    return f"{result.data[0]['name']} ({result.data[0]['asset_tag']})"


# --------------------------------------------------------------------------
# Allocations
# --------------------------------------------------------------------------

def list_allocations(
    user: CurrentUser,
    params: PageParams,
    status: Optional[str],
    employee_id: Optional[str],
    department_id: Optional[str],
    asset_id: Optional[str],
    mine: bool,
) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("allocations")
        .select(ALLOCATION_SELECT, count="exact")
        .order("allocated_at", desc=True)
    )
    # Employees only ever see their own allocations.
    if mine or user.role == EMPLOYEE:
        employee_id = user.id
    if status == "overdue":
        query = query.eq("status", "active").lt(
            "expected_return_date", date.today().isoformat()
        )
    elif status:
        query = query.eq("status", status)
    if employee_id:
        query = query.eq("employee_id", employee_id)
    if department_id:
        query = query.eq("department_id", department_id)
    if asset_id:
        query = query.eq("asset_id", asset_id)

    result = paged(query, params).execute()
    return list_response(
        [enrich_allocation(r, user) for r in result.data], params, result.count
    )


def allocate(user: CurrentUser, payload: AllocationCreate) -> dict[str, Any]:
    client = get_service_client()
    try:
        result = client.rpc(
            "allocate_asset",
            {
                "p_asset_id": payload.asset_id,
                "p_employee_id": payload.employee_id,
                "p_department_id": payload.department_id,
                "p_allocated_by": user.id,
                "p_expected_return_date": (
                    payload.expected_return_date.isoformat()
                    if payload.expected_return_date else None
                ),
                "p_notes": payload.notes,
            },
        ).execute()
    except PostgrestError as exc:
        code = rpc_error_code(exc)
        if code == "ASSET_NOT_AVAILABLE" or exc.code == UNIQUE_VIOLATION:
            active = _active_allocation_for_asset(payload.asset_id)
            if active is not None:
                raise _already_allocated_error(active) from exc
            asset = client.table("assets").select("status").eq("id", payload.asset_id).limit(1).execute()
            current_status = asset.data[0]["status"] if asset.data else "unknown"
            raise ApiError.conflict(
                "ASSET_NOT_AVAILABLE",
                f"This asset is not available (status: {current_status}).",
                details={"status": current_status},
            ) from exc
        raise map_db_error(exc) from exc

    row = result.data[0] if isinstance(result.data, list) else result.data
    allocation = _get_allocation(row["id"])
    label = _asset_label(payload.asset_id)
    _notify_new_holder(allocation, label)
    notification_service.log(
        user.id, "allocation.created", "allocation", allocation["id"],
        {"asset_id": payload.asset_id, "employee_id": payload.employee_id,
         "department_id": payload.department_id},
    )
    return {"data": enrich_allocation(allocation, user)}


def request_return(user: CurrentUser, allocation_id: str) -> dict[str, Any]:
    allocation = _get_allocation(allocation_id)
    if allocation["status"] != "active":
        raise ApiError.conflict("ALREADY_PROCESSED", "This allocation is already closed.")

    is_holder = allocation.get("employee_id") == user.id
    is_dept_holder = (
        allocation.get("department_id")
        and allocation["department_id"] == user.department_id
        and user.role in (DEPARTMENT_HEAD, *MANAGERS)
    )
    if not (is_holder or is_dept_holder or user.role in MANAGERS):
        raise ApiError.forbidden("Only the holder can request a return.")

    get_service_client().table("allocations").update({"return_requested": True}).eq(
        "id", allocation_id
    ).execute()
    label = _asset_label(allocation["asset_id"])
    notification_service.notify_roles(
        [ADMIN, ASSET_MANAGER], "return_requested", "Return requested",
        f"{user.full_name} wants to return {label}.", "allocation", allocation_id,
        exclude_user_id=user.id,
    )
    notification_service.log(user.id, "allocation.return_requested", "allocation", allocation_id)
    return {"data": {**enrich_allocation(allocation, user), "return_requested": True}}


def return_asset(
    user: CurrentUser, allocation_id: str, payload: AllocationReturn
) -> dict[str, Any]:
    try:
        get_service_client().rpc(
            "return_asset",
            {
                "p_allocation_id": allocation_id,
                "p_returned_to": user.id,
                "p_condition": payload.condition,
                "p_notes": payload.notes,
            },
        ).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc

    allocation = _get_allocation(allocation_id)
    label = _asset_label(allocation["asset_id"])
    if allocation.get("employee_id"):
        notification_service.notify(
            [allocation["employee_id"]], "asset_returned", "Return processed",
            f"{label} has been checked back in.", "allocation", allocation_id,
        )
    notification_service.log(
        user.id, "allocation.returned", "allocation", allocation_id,
        {"condition": payload.condition},
    )
    return {"data": enrich_allocation(allocation, user)}


# --------------------------------------------------------------------------
# Transfers
# --------------------------------------------------------------------------

def _transfer_target_department(row: dict[str, Any]) -> Optional[str]:
    if row.get("to_department_id"):
        return row["to_department_id"]
    return (row.get("to_employee") or {}).get("department_id")


def enrich_transfer(
    row: dict[str, Any], user: Optional[CurrentUser] = None
) -> dict[str, Any]:
    """Shape a transfer row: from_holder, to_target, reviewer objects, actions."""
    row = dict(row)
    _, from_holder = holder_of(row.get("from_allocation") or {})
    row["from_holder"] = from_holder or {"id": None, "name": "Unknown"}
    if row.get("to_employee"):
        row["to_target"] = {
            "type": "employee",
            "id": row["to_employee"]["id"],
            "name": row["to_employee"]["full_name"],
        }
    elif row.get("to_department"):
        row["to_target"] = {
            "type": "department",
            "id": row["to_department"]["id"],
            "name": row["to_department"]["name"],
        }
    else:
        row["to_target"] = {"type": None, "id": None, "name": "Unknown"}
    row["requested_by"] = row.pop("requested_by_user", None) or {"full_name": None}
    row["reviewed_by"] = row.pop("reviewed_by_user", None)

    can_review = user is not None and row.get("status") == "pending" and (
        user.role in MANAGERS
        or (
            user.role == DEPARTMENT_HEAD
            and _transfer_target_department(row) == user.department_id
        )
    )
    row["allowed_actions"] = ["approve", "reject"] if can_review else []
    return row


def list_transfers(
    user: CurrentUser,
    params: PageParams,
    status: Optional[str],
    asset_id: Optional[str],
    mine: bool,
) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("transfer_requests")
        .select(TRANSFER_SELECT, count="exact")
        .order("created_at", desc=True)
    )
    if mine or user.role == EMPLOYEE:
        query = query.eq("requested_by", user.id)
    if status:
        query = query.eq("status", status)
    if asset_id:
        query = query.eq("asset_id", asset_id)
    result = paged(query, params).execute()
    return list_response(
        [enrich_transfer(r, user) for r in result.data], params, result.count
    )


def create_transfer(user: CurrentUser, payload: TransferCreate) -> dict[str, Any]:
    active = _active_allocation_for_asset(payload.asset_id)
    if active is None:
        raise ApiError.conflict(
            "ASSET_NOT_ALLOCATED",
            "This asset has no active allocation — allocate it directly instead.",
        )
    pending = (
        get_service_client()
        .table("transfer_requests")
        .select("id", count="exact")
        .eq("asset_id", payload.asset_id)
        .eq("status", "pending")
        .limit(1)
        .execute()
    )
    if pending.count:
        raise ApiError.conflict(
            "DUPLICATE_RESOURCE", "A transfer request for this asset is already pending."
        )

    result = (
        get_service_client()
        .table("transfer_requests")
        .insert(
            {
                "asset_id": payload.asset_id,
                "from_allocation_id": active["id"],
                "requested_by": user.id,
                "to_employee_id": payload.to_employee_id,
                "to_department_id": payload.to_department_id,
                "reason": payload.reason,
            }
        )
        .execute()
    )
    transfer = result.data[0]
    label = _asset_label(payload.asset_id)
    notification_service.notify_roles(
        [ADMIN, ASSET_MANAGER], "transfer_requested", "Transfer requested",
        f"{user.full_name} requested a transfer of {label}.",
        "transfer", transfer["id"], exclude_user_id=user.id,
    )
    notification_service.log(user.id, "transfer.requested", "transfer", transfer["id"],
                             {"asset_id": payload.asset_id})
    return {"data": enrich_transfer(_get_transfer(transfer["id"]), user)}


def _get_transfer(transfer_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("transfer_requests")
        .select(TRANSFER_SELECT)
        .eq("id", transfer_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Transfer request")
    return result.data[0]


def _target_department_id(transfer: dict[str, Any]) -> Optional[str]:
    if transfer.get("to_department_id"):
        return transfer["to_department_id"]
    if transfer.get("to_employee_id"):
        target = (
            get_service_client()
            .table("profiles")
            .select("department_id")
            .eq("id", transfer["to_employee_id"])
            .limit(1)
            .execute()
        )
        return target.data[0]["department_id"] if target.data else None
    return None


def _check_review_permission(user: CurrentUser, transfer: dict[str, Any]) -> None:
    if user.role in MANAGERS:
        return
    if user.role == DEPARTMENT_HEAD:
        target_dept = _target_department_id(transfer)
        if target_dept and target_dept == user.department_id:
            return
        raise ApiError.forbidden("You can only review transfers into your own department.")
    raise ApiError.forbidden()


def approve_transfer(user: CurrentUser, transfer_id: str, notes: Optional[str]) -> dict[str, Any]:
    transfer = _get_transfer(transfer_id)
    _check_review_permission(user, transfer)
    try:
        get_service_client().rpc(
            "approve_transfer",
            {"p_transfer_id": transfer_id, "p_reviewer": user.id, "p_review_notes": notes},
        ).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc

    transfer = _get_transfer(transfer_id)
    new_allocation = _active_allocation_for_asset(transfer["asset_id"])
    label = _asset_label(transfer["asset_id"])
    notification_service.notify(
        [transfer["requested_by"]], "transfer_approved", "Transfer approved",
        f"Your transfer request for {label} was approved.", "transfer", transfer_id,
    )
    if new_allocation is not None:
        _notify_new_holder(new_allocation, label)
    notification_service.log(user.id, "transfer.approved", "transfer", transfer_id)
    return {
        "data": {
            "transfer": enrich_transfer(transfer, user),
            "new_allocation": (
                enrich_allocation(new_allocation, user) if new_allocation else None
            ),
        }
    }


def reject_transfer(user: CurrentUser, transfer_id: str, reason: Optional[str]) -> dict[str, Any]:
    transfer = _get_transfer(transfer_id)
    _check_review_permission(user, transfer)
    if transfer["status"] != "pending":
        raise ApiError.conflict("ALREADY_PROCESSED", "This transfer request was already reviewed.")

    get_service_client().table("transfer_requests").update(
        {"status": "rejected", "reviewed_by": user.id,
         "reviewed_at": datetime.now(timezone.utc).isoformat(), "review_notes": reason}
    ).eq("id", transfer_id).eq("status", "pending").execute()

    label = _asset_label(transfer["asset_id"])
    notification_service.notify(
        [transfer["requested_by"]], "transfer_rejected", "Transfer rejected",
        f"Your transfer request for {label} was rejected.", "transfer", transfer_id,
    )
    notification_service.log(user.id, "transfer.rejected", "transfer", transfer_id,
                             {"reason": reason})
    return {"data": enrich_transfer(_get_transfer(transfer_id), user)}
