"""Employee directory: listing plus the admin-only role/status management."""

from collections import Counter
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser, PROFILE_SELECT, fetch_profile
from core.errors import ApiError
from core.pagination import PageParams, list_response, paged
from core.permissions import DEPARTMENT_HEAD
from database.errors import map_db_error
from database.supabase import get_service_client
from schemas.employees import EmployeeUpdate
from services import notification_service
from services.serializers import profile_out


def _active_allocation_counts(employee_ids: list[str]) -> Counter:
    if not employee_ids:
        return Counter()
    result = (
        get_service_client()
        .table("allocations")
        .select("employee_id")
        .in_("employee_id", employee_ids)
        .eq("status", "active")
        .execute()
    )
    return Counter(row["employee_id"] for row in result.data)


def list_employees(
    user: CurrentUser,
    params: PageParams,
    search: Optional[str],
    department_id: Optional[str],
    role: Optional[str],
    status: Optional[str],
) -> dict[str, Any]:
    query = (
        get_service_client()
        .table("profiles")
        .select(PROFILE_SELECT, count="exact")
        .order("full_name")
    )
    # Department heads only see their own department's directory.
    if user.role == DEPARTMENT_HEAD:
        if user.department_id is None:
            return list_response([], params, 0)
        department_id = user.department_id
    if search:
        query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%")
    if department_id:
        query = query.eq("department_id", department_id)
    if role:
        query = query.eq("role", role)
    if status:
        query = query.eq("status", status)

    result = paged(query, params).execute()
    counts = _active_allocation_counts([row["id"] for row in result.data])
    data = [
        {**profile_out(row), "active_allocations": counts.get(row["id"], 0)}
        for row in result.data
    ]
    return list_response(data, params, result.count)


def get_employee(employee_id: str) -> dict[str, Any]:
    profile = fetch_profile(employee_id)
    if profile is None:
        raise ApiError.not_found("Employee")
    counts = _active_allocation_counts([employee_id])
    return {"data": {**profile_out(profile), "active_allocations": counts.get(employee_id, 0)}}


def update_employee(
    admin: CurrentUser, employee_id: str, payload: EmployeeUpdate
) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return get_employee(employee_id)

    current = fetch_profile(employee_id)
    if current is None:
        raise ApiError.not_found("Employee")
    if employee_id == admin.id and ("role" in updates or "status" in updates):
        raise ApiError.conflict(
            "CANNOT_MODIFY_SELF", "You cannot change your own role or status."
        )

    try:
        get_service_client().table("profiles").update(updates).eq("id", employee_id).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc

    if "role" in updates and updates["role"] != current["role"]:
        notification_service.log(
            admin.id, "employee.role_changed", "employee", employee_id,
            {"from": current["role"], "to": updates["role"]},
        )
        notification_service.notify(
            [employee_id], "role_changed", "Your role was updated",
            f"You are now a { updates['role'].replace('_', ' ').title() }.",
            "employee", employee_id,
        )
    if "status" in updates and updates["status"] != current["status"]:
        notification_service.log(
            admin.id, "employee.status_changed", "employee", employee_id,
            {"from": current["status"], "to": updates["status"]},
        )

    return get_employee(employee_id)
