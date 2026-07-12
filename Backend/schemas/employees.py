"""Request bodies for /employees endpoints."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class EmployeeUpdate(BaseModel):
    """Admin-only directory update. This is the ONLY place roles change."""

    full_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    role: Optional[Literal["admin", "asset_manager", "department_head", "employee"]] = None
    department_id: Optional[str] = None
    status: Optional[Literal["active", "inactive"]] = None
