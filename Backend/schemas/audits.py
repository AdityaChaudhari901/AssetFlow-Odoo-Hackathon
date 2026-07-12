"""Request bodies for /audits endpoints."""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


class AuditCycleCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    department_id: Optional[str] = None
    location: Optional[str] = None
    start_date: date
    end_date: date
    auditor_ids: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def _valid_range(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date.")
        return self


class AuditRecordUpdate(BaseModel):
    asset_id: str
    result: Literal["verified", "missing", "damaged"]
    notes: Optional[str] = None
