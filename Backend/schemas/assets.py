"""Request bodies for /assets endpoints."""

from datetime import date
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

Condition = Literal["new", "good", "fair", "poor", "damaged"]
AssetStatus = Literal[
    "available", "allocated", "reserved", "under_maintenance", "lost", "retired", "disposed"
]


class AssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category_id: str
    serial_number: Optional[str] = None
    acquisition_date: Optional[date] = None
    acquisition_cost: Optional[float] = Field(default=None, ge=0)
    condition: Condition = "good"
    location: Optional[str] = None
    department_id: Optional[str] = None
    is_bookable: bool = False
    image_url: Optional[str] = None
    custom_field_values: dict[str, Any] = {}


class AssetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    category_id: Optional[str] = None
    serial_number: Optional[str] = None
    acquisition_date: Optional[date] = None
    acquisition_cost: Optional[float] = Field(default=None, ge=0)
    condition: Optional[Condition] = None
    location: Optional[str] = None
    department_id: Optional[str] = None
    is_bookable: Optional[bool] = None
    image_url: Optional[str] = None
    custom_field_values: Optional[dict[str, Any]] = None


class AssetStatusChange(BaseModel):
    status: AssetStatus
    notes: Optional[str] = None
