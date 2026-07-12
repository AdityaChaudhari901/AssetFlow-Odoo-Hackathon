"""Dashboard KPIs and return lists. Overdue is always computed, never stored."""

from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from core.pagination import PageParams, list_response, paged
from database.supabase import get_service_client
from services.allocation_service import ALLOCATION_SELECT, _with_overdue


def _count(table: str, filters) -> int:
    query = get_service_client().table(table).select("id", count="exact")
    query = filters(query)
    return query.limit(1).execute().count or 0


def kpis() -> dict[str, Any]:
    today = date.today()
    today_start = datetime.combine(today, time.min, tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    week_ahead = today + timedelta(days=7)

    return {
        "data": {
            "assets_available": _count("assets", lambda q: q.eq("status", "available")),
            "assets_allocated": _count("assets", lambda q: q.eq("status", "allocated")),
            "maintenance_active": _count(
                "maintenance_requests",
                lambda q: q.in_("status", ["approved", "assigned", "in_progress"]),
            ),
            "active_bookings_today": _count(
                "bookings",
                lambda q: q.eq("status", "confirmed")
                .lt("start_time", today_end.isoformat())
                .gt("end_time", today_start.isoformat()),
            ),
            "pending_transfers": _count(
                "transfer_requests", lambda q: q.eq("status", "pending")
            ),
            "upcoming_returns": _count(
                "allocations",
                lambda q: q.eq("status", "active")
                .gte("expected_return_date", today.isoformat())
                .lte("expected_return_date", week_ahead.isoformat()),
            ),
            "overdue_returns": _count(
                "allocations",
                lambda q: q.eq("status", "active")
                .lt("expected_return_date", today.isoformat()),
            ),
        }
    }


def returns(type_: str, params: PageParams) -> dict[str, Any]:
    today = date.today()
    query = (
        get_service_client()
        .table("allocations")
        .select(ALLOCATION_SELECT, count="exact")
        .eq("status", "active")
        .order("expected_return_date")
    )
    if type_ == "overdue":
        query = query.lt("expected_return_date", today.isoformat())
    else:  # upcoming (next 7 days)
        query = query.gte("expected_return_date", today.isoformat()).lte(
            "expected_return_date", (today + timedelta(days=7)).isoformat()
        )
    result = paged(query, params).execute()
    rows = []
    for row in result.data:
        row = _with_overdue(row)
        due = date.fromisoformat(row["expected_return_date"])
        row["days_overdue"] = max(0, (today - due).days)
        rows.append(row)
    return list_response(rows, params, result.count)
