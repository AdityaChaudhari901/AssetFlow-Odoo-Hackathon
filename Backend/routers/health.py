"""Health-check endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends

from config.settings import Settings, get_settings
from schemas.health import HealthResponse

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
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )
