"""Health endpoint schemas."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Process-level health response."""

    status: Literal["ok"] = "ok"
    service: str
    version: str
    environment: str

