"""Request bodies for /allocations and /transfers endpoints."""

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, model_validator

Condition = Literal["new", "good", "fair", "poor", "damaged"]


class _SingleTarget(BaseModel):
    """Exactly one of employee/department must be given."""

    @model_validator(mode="after")
    def _exactly_one_target(self):
        employee = getattr(self, "employee_id", None) or getattr(self, "to_employee_id", None)
        department = getattr(self, "department_id", None) or getattr(self, "to_department_id", None)
        if bool(employee) == bool(department):
            raise ValueError("Provide exactly one of employee or department as the target.")
        return self


class AllocationCreate(_SingleTarget):
    asset_id: str
    employee_id: Optional[str] = None
    department_id: Optional[str] = None
    expected_return_date: Optional[date] = None
    notes: Optional[str] = None


class AllocationReturn(BaseModel):
    condition: Condition
    notes: Optional[str] = None


class TransferCreate(_SingleTarget):
    asset_id: str
    to_employee_id: Optional[str] = None
    to_department_id: Optional[str] = None
    reason: Optional[str] = None


class ReviewNotes(BaseModel):
    reason: Optional[str] = None
