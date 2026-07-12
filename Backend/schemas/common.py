"""Shared API response schemas."""

from typing import Any, Optional

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Machine-readable and user-safe API error details."""

    code: str
    message: str
    request_id: Optional[str] = None
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Stable top-level API error envelope."""

    error: ErrorDetail

