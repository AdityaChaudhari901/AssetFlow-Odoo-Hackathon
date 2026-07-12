"""Versioned API router composition."""

from fastapi import APIRouter

from routers.activity_logs import router as activity_logs_router
from routers.allocations import router as allocations_router
from routers.assets import router as assets_router
from routers.audits import router as audits_router
from routers.auth import router as auth_router
from routers.bookings import router as bookings_router
from routers.categories import router as categories_router
from routers.dashboard import router as dashboard_router
from routers.departments import router as departments_router
from routers.employees import router as employees_router
from routers.health import router as health_router
from routers.jobs import router as jobs_router
from routers.maintenance import router as maintenance_router
from routers.notifications import router as notifications_router
from routers.reports import router as reports_router
from routers.transfers import router as transfers_router
from routers.uploads import router as uploads_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["Health"])
api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(departments_router)
api_router.include_router(categories_router)
api_router.include_router(assets_router)
api_router.include_router(allocations_router)
api_router.include_router(transfers_router)
api_router.include_router(bookings_router)
api_router.include_router(maintenance_router)
api_router.include_router(audits_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(notifications_router)
api_router.include_router(activity_logs_router)
api_router.include_router(uploads_router)
api_router.include_router(jobs_router)
