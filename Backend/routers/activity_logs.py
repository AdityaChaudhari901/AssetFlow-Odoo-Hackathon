"""Activity log endpoints (admin only)."""

from datetime import datetime
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query

from core.auth import CurrentUser
from core.pagination import PageParams, list_response, page_params, paged
from core.permissions import ADMIN, require_roles
from database.supabase import get_service_client

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])

LOG_SELECT = "*, actor:profiles!activity_logs_actor_id_fkey(id, full_name)"


@router.get("")
def list_activity_logs(
    admin: Annotated[CurrentUser, Depends(require_roles(ADMIN))],
    params: Annotated[PageParams, Depends(page_params)],
    actor_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    from_: Annotated[Optional[datetime], Query(alias="from")] = None,
    to: Optional[datetime] = None,
) -> dict:
    query = (
        get_service_client()
        .table("activity_logs")
        .select(LOG_SELECT, count="exact")
        .order("created_at", desc=True)
    )
    if actor_id:
        query = query.eq("actor_id", actor_id)
    if entity_type:
        query = query.eq("entity_type", entity_type)
    if action:
        query = query.eq("action", action)
    if from_:
        query = query.gte("created_at", from_.isoformat())
    if to:
        query = query.lte("created_at", to.isoformat())
    result = paged(query, params).execute()
    return list_response(result.data, params, result.count)
