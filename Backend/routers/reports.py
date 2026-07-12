"""Reports & analytics endpoints (managers; department heads get scoped rows)."""

from datetime import datetime
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response

from core.auth import CurrentUser
from core.permissions import ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD, require_roles
from services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

ReportUser = Annotated[
    CurrentUser, Depends(require_roles(ADMIN, ASSET_MANAGER, DEPARTMENT_HEAD))
]


@router.get("/utilization")
def utilization(
    user: ReportUser,
    from_: Annotated[Optional[datetime], Query(alias="from")] = None,
    to: Optional[datetime] = None,
) -> dict:
    return report_service.utilization(user, from_, to)


@router.get("/maintenance-frequency")
def maintenance_frequency(
    user: ReportUser, group_by: Literal["asset", "category"] = "asset"
) -> dict:
    return report_service.maintenance_frequency(user, group_by)


@router.get("/attention")
def attention(user: ReportUser) -> dict:
    return report_service.attention(user)


@router.get("/department-allocation")
def department_allocation(user: ReportUser) -> dict:
    return report_service.department_allocation(user)


@router.get("/booking-heatmap")
def booking_heatmap(
    user: ReportUser,
    asset_id: Optional[str] = None,
    from_: Annotated[Optional[datetime], Query(alias="from")] = None,
    to: Optional[datetime] = None,
) -> dict:
    return report_service.booking_heatmap(user, asset_id, from_, to)


@router.get("/export")
def export(
    user: ReportUser,
    report: str,
    format: Literal["csv"] = "csv",
    group_by: Optional[str] = None,
    asset_id: Optional[str] = None,
    from_: Annotated[Optional[datetime], Query(alias="from")] = None,
    to: Optional[datetime] = None,
) -> Response:
    filename, csv_text = report_service.export_csv(
        user, report, group_by=group_by, asset_id=asset_id, from_=from_, to=to
    )
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
