"""Departments and asset categories (admin-managed master data)."""

from collections import Counter
from typing import Any, Optional

from postgrest.exceptions import APIError as PostgrestError

from core.auth import CurrentUser
from core.errors import ApiError
from database.errors import map_db_error
from database.supabase import get_service_client
from schemas.categories import CategoryCreate, CategoryUpdate
from schemas.departments import DepartmentCreate, DepartmentUpdate
from services import notification_service

DEPARTMENT_SELECT = (
    "id, name, description, parent_department_id, status, created_at, updated_at, "
    "head:profiles!departments_head_fk(id, full_name)"
)


# --------------------------------------------------------------------------
# Departments
# --------------------------------------------------------------------------

def _department_counts() -> tuple[Counter, Counter]:
    client = get_service_client()
    employees = client.table("profiles").select("department_id").eq("status", "active").execute()
    assets = client.table("assets").select("department_id").execute()
    return (
        Counter(r["department_id"] for r in employees.data if r["department_id"]),
        Counter(r["department_id"] for r in assets.data if r["department_id"]),
    )


def list_departments(status: Optional[str], search: Optional[str]) -> dict[str, Any]:
    query = get_service_client().table("departments").select(DEPARTMENT_SELECT).order("name")
    if status:
        query = query.eq("status", status)
    if search:
        query = query.ilike("name", f"%{search}%")
    result = query.execute()
    employee_counts, asset_counts = _department_counts()
    data = [
        {
            **row,
            "employee_count": employee_counts.get(row["id"], 0),
            "asset_count": asset_counts.get(row["id"], 0),
        }
        for row in result.data
    ]
    return {"data": data}


def get_department(department_id: str) -> dict[str, Any]:
    result = (
        get_service_client()
        .table("departments")
        .select(DEPARTMENT_SELECT)
        .eq("id", department_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ApiError.not_found("Department")
    return {"data": result.data[0]}


def create_department(admin: CurrentUser, payload: DepartmentCreate) -> dict[str, Any]:
    try:
        result = (
            get_service_client()
            .table("departments")
            .insert(payload.model_dump())
            .execute()
        )
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    department = result.data[0]
    notification_service.log(admin.id, "department.created", "department", department["id"],
                             {"name": department["name"]})
    return get_department(department["id"])


def update_department(
    admin: CurrentUser, department_id: str, payload: DepartmentUpdate
) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("parent_department_id") == department_id:
        raise ApiError.conflict("VALIDATION_ERROR", "A department cannot be its own parent.")
    if updates:
        try:
            result = (
                get_service_client()
                .table("departments")
                .update(updates)
                .eq("id", department_id)
                .execute()
            )
        except PostgrestError as exc:
            raise map_db_error(exc) from exc
        if not result.data:
            raise ApiError.not_found("Department")
        notification_service.log(admin.id, "department.updated", "department",
                                 department_id, {"fields": sorted(updates)})
    return get_department(department_id)


# --------------------------------------------------------------------------
# Asset categories
# --------------------------------------------------------------------------

def list_categories(status: Optional[str]) -> dict[str, Any]:
    query = get_service_client().table("asset_categories").select("*").order("name")
    if status:
        query = query.eq("status", status)
    return {"data": query.execute().data}


def create_category(admin: CurrentUser, payload: CategoryCreate) -> dict[str, Any]:
    body = payload.model_dump()
    body["custom_fields"] = [f.model_dump() for f in payload.custom_fields]
    try:
        result = get_service_client().table("asset_categories").insert(body).execute()
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    category = result.data[0]
    notification_service.log(admin.id, "category.created", "category", category["id"],
                             {"name": category["name"]})
    return {"data": category}


def update_category(
    admin: CurrentUser, category_id: str, payload: CategoryUpdate
) -> dict[str, Any]:
    updates = payload.model_dump(exclude_unset=True)
    if "custom_fields" in updates and payload.custom_fields is not None:
        updates["custom_fields"] = [f.model_dump() for f in payload.custom_fields]
    if not updates:
        raise ApiError(400, "VALIDATION_ERROR", "No fields to update.")
    try:
        result = (
            get_service_client()
            .table("asset_categories")
            .update(updates)
            .eq("id", category_id)
            .execute()
        )
    except PostgrestError as exc:
        raise map_db_error(exc) from exc
    if not result.data:
        raise ApiError.not_found("Category")
    notification_service.log(admin.id, "category.updated", "category", category_id,
                             {"fields": sorted(updates)})
    return {"data": result.data[0]}
