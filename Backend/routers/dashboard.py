"""Dashboard endpoints."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends

from core.auth import CurrentUser, get_current_user
from core.pagination import PageParams, page_params
from services import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

AnyUser = Annotated[CurrentUser, Depends(get_current_user)]


@router.get("/kpis")
def get_kpis(user: AnyUser) -> dict:
    return dashboard_service.kpis()


@router.get("/returns")
def get_returns(
    user: AnyUser,
    params: Annotated[PageParams, Depends(page_params)],
    type: Literal["overdue", "upcoming"] = "overdue",
) -> dict:
    return dashboard_service.returns(type, params)
