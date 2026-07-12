"""Request bodies for /departments endpoints."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class DepartmentCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    head_id: Optional[str] = None
    parent_department_id: Optional[str] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    head_id: Optional[str] = None
    parent_department_id: Optional[str] = None
    status: Optional[Literal["active", "inactive"]] = None
