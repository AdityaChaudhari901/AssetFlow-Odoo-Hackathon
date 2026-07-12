"""Small shared shaping helpers for API payloads."""

from typing import Any, Optional


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
    }
