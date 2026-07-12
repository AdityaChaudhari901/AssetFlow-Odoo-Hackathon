"""FastAPI application composition for AssetFlow."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import get_settings
from middleware.exceptions import register_exception_handlers
from middleware.request_context import RequestContextMiddleware
from routers.api import api_router
from routers.health import router as health_router


def create_application() -> FastAPI:
    """Create and configure the AssetFlow FastAPI application."""
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    application.add_middleware(RequestContextMiddleware)

    register_exception_handlers(application)

    application.include_router(health_router, include_in_schema=False)
    application.include_router(api_router, prefix=settings.api_v1_prefix)

    return application


app = create_application()

