"""Reports & analytics. Rows are pulled via the service client and aggregated
in Python — hackathon scale is hundreds of rows, not millions.

Department heads get every report scoped to their own department."""

import csv
import io
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import Any, Callable, Optional

from core.auth import CurrentUser
from core.errors import ApiError
from core.permissions import DEPARTMENT_HEAD
from database.supabase import get_service_client

ATTENTION_MAINTENANCE_THRESHOLD = 3
ATTENTION_AGE_YEARS = 4


def _scope_department(user: CurrentUser) -> Optional[str]:
    return user.department_id if user.role == DEPARTMENT_HEAD else None


def _parse_ts(value: str) -> datetime:
    return datetime.fromisoformat(value)


def _default_range(
    from_: Optional[datetime], to: Optional[datetime]
) -> tuple[datetime, datetime]:
    to = to or datetime.now(timezone.utc)
    from_ = from_ or (to - timedelta(days=90))
    if from_.tzinfo is None:
        from_ = from_.replace(tzinfo=timezone.utc)
    if to.tzinfo is None:
        to = to.replace(tzinfo=timezone.utc)
    return from_, to


def _assets(scope_department: Optional[str]) -> list[dict[str, Any]]:
    query = (
        get_service_client()
        .table("assets")
        .select(
            "id, asset_tag, name, category_id, department_id, status, condition, "
            "acquisition_date, acquisition_cost, created_at, "
            "category:asset_categories!assets_category_id_fkey(id, name)"
        )
    )
    if scope_department:
        query = query.eq("department_id", scope_department)
    return query.execute().data


# --------------------------------------------------------------------------
# Reports
# --------------------------------------------------------------------------

def utilization(
    user: CurrentUser, from_: Optional[datetime], to: Optional[datetime]
) -> dict[str, Any]:
    from_, to = _default_range(from_, to)
    range_days = max(1, (to - from_).days)
    assets = _assets(_scope_department(user))
    asset_ids = [a["id"] for a in assets]

    allocated_seconds: dict[str, float] = defaultdict(float)
    if asset_ids:
        allocations = (
            get_service_client()
            .table("allocations")
            .select("asset_id, allocated_at, returned_at, status")
            .in_("asset_id", asset_ids)
            .lt("allocated_at", to.isoformat())
            .execute()
        )
        for row in allocations.data:
            start = max(_parse_ts(row["allocated_at"]), from_)
            end = _parse_ts(row["returned_at"]) if row.get("returned_at") else to
            end = min(end, to)
            if end > start:
                allocated_seconds[row["asset_id"]] += (end - start).total_seconds()

    rows = []
    for asset in assets:
        days = allocated_seconds[asset["id"]] / 86400
        rows.append(
            {
                "asset": {"id": asset["id"], "asset_tag": asset["asset_tag"], "name": asset["name"]},
                "allocated_days": round(days, 1),
                "utilization_pct": round(min(100.0, days / range_days * 100), 1),
            }
        )
    rows.sort(key=lambda r: r["utilization_pct"], reverse=True)
    return {"data": rows, "meta": {"from": from_.isoformat(), "to": to.isoformat()}}


def maintenance_frequency(user: CurrentUser, group_by: str) -> dict[str, Any]:
    scope = _scope_department(user)
    assets = {a["id"]: a for a in _assets(scope)}
    query = (
        get_service_client()
        .table("maintenance_requests")
        .select("asset_id, status, cost")
    )
    requests = [r for r in query.execute().data if not scope or r["asset_id"] in assets]

    grouped: dict[str, dict[str, Any]] = {}
    for request in requests:
        asset = assets.get(request["asset_id"])
        if asset is None:  # scoped out or deleted
            continue
        if group_by == "category":
            category = asset.get("category") or {}
            key, name = category.get("id", "uncategorised"), category.get("name", "Uncategorised")
        else:
            key, name = asset["id"], f"{asset['name']} ({asset['asset_tag']})"
        entry = grouped.setdefault(
            key, {"key": key, "name": name, "request_count": 0, "resolved_count": 0, "total_cost": 0.0}
        )
        entry["request_count"] += 1
        if request["status"] == "resolved":
            entry["resolved_count"] += 1
        entry["total_cost"] += float(request.get("cost") or 0)

    rows = sorted(grouped.values(), key=lambda r: r["request_count"], reverse=True)
    return {"data": rows}


def attention(user: CurrentUser) -> dict[str, Any]:
    """Assets due for maintenance or nearing retirement."""
    assets = _assets(_scope_department(user))
    counts = Counter(
        row["asset_id"]
        for row in get_service_client()
        .table("maintenance_requests")
        .select("asset_id")
        .execute()
        .data
    )
    age_cutoff = date.today() - timedelta(days=ATTENTION_AGE_YEARS * 365)

    rows = []
    for asset in assets:
        reasons = []
        if counts.get(asset["id"], 0) >= ATTENTION_MAINTENANCE_THRESHOLD:
            reasons.append(f"{counts[asset['id']]} maintenance requests")
        if asset["condition"] in ("poor", "damaged"):
            reasons.append(f"condition is {asset['condition']}")
        acquired = asset.get("acquisition_date")
        if acquired and date.fromisoformat(acquired) < age_cutoff:
            reasons.append(f"older than {ATTENTION_AGE_YEARS} years")
        if reasons:
            rows.append(
                {
                    "asset": {"id": asset["id"], "asset_tag": asset["asset_tag"],
                               "name": asset["name"], "status": asset["status"]},
                    "condition": asset["condition"],
                    "maintenance_count": counts.get(asset["id"], 0),
                    "acquisition_date": acquired,
                    "reasons": reasons,
                }
            )
    rows.sort(key=lambda r: len(r["reasons"]), reverse=True)
    return {"data": rows}


def department_allocation(user: CurrentUser) -> dict[str, Any]:
    client = get_service_client()
    scope = _scope_department(user)

    departments = {d["id"]: d["name"] for d in client.table("departments").select("id, name").execute().data}
    profiles = {p["id"]: p["department_id"] for p in client.table("profiles").select("id, department_id").execute().data}
    assets = {a["id"]: a for a in _assets(None)}

    allocations = (
        client.table("allocations")
        .select("asset_id, employee_id, department_id")
        .eq("status", "active")
        .execute()
    )
    grouped: dict[str, dict[str, Any]] = {}
    for row in allocations.data:
        dept_id = row["department_id"] or profiles.get(row["employee_id"])
        if dept_id is None or (scope and dept_id != scope):
            continue
        entry = grouped.setdefault(
            dept_id,
            {"department": {"id": dept_id, "name": departments.get(dept_id, "Unknown")},
             "allocated_count": 0, "total_acquisition_cost": 0.0},
        )
        entry["allocated_count"] += 1
        asset = assets.get(row["asset_id"]) or {}
        entry["total_acquisition_cost"] += float(asset.get("acquisition_cost") or 0)

    rows = sorted(grouped.values(), key=lambda r: r["allocated_count"], reverse=True)
    return {"data": rows}


def booking_heatmap(
    user: CurrentUser,
    asset_id: Optional[str],
    from_: Optional[datetime],
    to: Optional[datetime],
) -> dict[str, Any]:
    from_, to = _default_range(from_, to)
    query = (
        get_service_client()
        .table("bookings")
        .select("asset_id, start_time, end_time")
        .eq("status", "confirmed")
        .gt("end_time", from_.isoformat())
        .lt("start_time", to.isoformat())
    )
    if asset_id:
        query = query.eq("asset_id", asset_id)
    bookings = query.execute().data

    scope = _scope_department(user)
    if scope:
        scoped_assets = {a["id"] for a in _assets(scope)}
        bookings = [b for b in bookings if b["asset_id"] in scoped_assets]

    cells: Counter = Counter()
    for booking in bookings:
        cursor = _parse_ts(booking["start_time"]).replace(minute=0, second=0, microsecond=0)
        end = _parse_ts(booking["end_time"])
        while cursor < end:
            cells[(cursor.weekday(), cursor.hour)] += 1
            cursor += timedelta(hours=1)

    return {
        "data": {
            "cells": [
                {"weekday": weekday, "hour": hour, "count": count}
                for (weekday, hour), count in sorted(cells.items())
            ]
        },
        "meta": {"from": from_.isoformat(), "to": to.isoformat()},
    }


# --------------------------------------------------------------------------
# CSV export
# --------------------------------------------------------------------------

def _flatten(row: dict[str, Any], prefix: str = "") -> dict[str, Any]:
    flat: dict[str, Any] = {}
    for key, value in row.items():
        name = f"{prefix}{key}"
        if isinstance(value, dict):
            flat.update(_flatten(value, f"{name}."))
        elif isinstance(value, list):
            flat[name] = "; ".join(map(str, value))
        else:
            flat[name] = value
    return flat


REPORTS: dict[str, Callable[..., dict[str, Any]]] = {
    "utilization": lambda user, **kw: utilization(user, kw.get("from_"), kw.get("to")),
    "maintenance-frequency": lambda user, **kw: maintenance_frequency(user, kw.get("group_by") or "asset"),
    "attention": lambda user, **kw: attention(user),
    "department-allocation": lambda user, **kw: department_allocation(user),
    "booking-heatmap": lambda user, **kw: booking_heatmap(
        user, kw.get("asset_id"), kw.get("from_"), kw.get("to")
    ),
}


def export_csv(user: CurrentUser, report: str, **kwargs: Any) -> tuple[str, str]:
    """Return (filename, csv_text) for any report above."""
    if report not in REPORTS:
        raise ApiError(400, "VALIDATION_ERROR", f"Unknown report '{report}'.")
    payload = REPORTS[report](user, **kwargs)
    data = payload["data"]
    rows = data.get("cells", []) if isinstance(data, dict) else data

    buffer = io.StringIO()
    flat_rows = [_flatten(row) for row in rows]
    fieldnames: list[str] = []
    for row in flat_rows:
        for key in row:
            if key not in fieldnames:
                fieldnames.append(key)
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(flat_rows)
    return f"assetflow-{report}-{date.today().isoformat()}.csv", buffer.getvalue()
