"""Small shared shaping helpers for API payloads."""

from typing import Any, Optional


def holder_of(row: dict[str, Any]) -> tuple[Optional[str], Optional[dict[str, Any]]]:
    """Normalize an allocation row's employee/department embeds into a holder.

    Returns (holder_type, holder) where holder is
    ``{id, name, full_name?, avatar_url?, department_name?}`` — the shape the
    frontend renders in UserChip and holder columns.
    """
    employee = row.get("employee")
    if employee:
        department = employee.get("department") or {}
        return "employee", {
            "id": employee["id"],
            "name": employee["full_name"],
            "full_name": employee["full_name"],
            "avatar_url": employee.get("avatar_url"),
            "department_name": department.get("name"),
        }
    department = row.get("department")
    if department:
        return "department", {
            "id": department["id"],
            "name": department["name"],
            "department_name": None,
        }
    return None, None


def profile_out(row: dict[str, Any]) -> dict[str, Any]:
    """Flatten a profiles row (with embedded department) to the UserProfile shape."""
    department = row.get("department") or {}
    return {
        "id": row["id"],
        "full_name": row["full_name"],
        "email": row["email"],
        "role": row["role"],
        "department_id": row.get("department_id"),
        "department_name": department.get("name"),
        "status": row["status"],
        "avatar_url": row.get("avatar_url"),
        "created_at": row.get("created_at"),
    }


def session_out(session: Any) -> Optional[dict[str, Any]]:
    """Shape a Supabase session object for API responses."""
    if session is None:
        return None
    return {
        "access_token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_at": session.expires_at,
        "user_id": getattr(getattr(session, "user", None), "id", None),
    }
