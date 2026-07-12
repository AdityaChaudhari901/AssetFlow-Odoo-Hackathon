"""Health service implementation."""

from config.settings import Settings
from schemas.health import HealthResponse


def get_health_status(settings: Settings) -> HealthResponse:
    """Build health metadata from validated application settings."""
    return HealthResponse(
        service=settings.app_name,
        version=settings.app_version,
        environment=settings.environment,
    )

