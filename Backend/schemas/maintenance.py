"""Request bodies for /maintenance endpoints."""

from typing import Literal, Optional

from pydantic import BaseModel, Field

Priority = Literal["low", "medium", "high", "critical"]


class MaintenanceCreate(BaseModel):
    asset_id: str
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    priority: Priority = "medium"
    photo_url: Optional[str] = None


class MaintenanceReject(BaseModel):
    reason: str = Field(min_length=1)


class MaintenanceAssign(BaseModel):
    technician_name: str = Field(min_length=1, max_length=120)


class MaintenanceResolve(BaseModel):
    resolution_notes: Optional[str] = None
    cost: Optional[float] = Field(default=None, ge=0)
