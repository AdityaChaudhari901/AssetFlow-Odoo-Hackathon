"""Request bodies for /bookings endpoints."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, model_validator


class BookingCreate(BaseModel):
    asset_id: str
    start_time: datetime
    end_time: datetime
    purpose: Optional[str] = None
    department_id: Optional[str] = None

    @model_validator(mode="after")
    def _valid_window(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time.")
        return self


class BookingReschedule(BaseModel):
    start_time: datetime
    end_time: datetime

    @model_validator(mode="after")
    def _valid_window(self):
        if self.end_time <= self.start_time:
            raise ValueError("end_time must be after start_time.")
        return self


class BookingCancel(BaseModel):
    reason: Optional[str] = None
