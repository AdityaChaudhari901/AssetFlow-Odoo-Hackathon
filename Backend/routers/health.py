"""Health-check endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from config.settings import Settings, get_settings
from schemas.health import HealthResponse
from services.health import get_health_status

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Report API health",
)
async def health_check(
    settings: Annotated[Settings, Depends(get_settings)],
) -> HealthResponse:
    """Return process-level liveness metadata without external dependencies."""
    return get_health_status(settings)

