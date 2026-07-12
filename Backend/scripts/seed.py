"""Seed demo data for AssetFlow.

Run once against your Supabase project (after applying db/000-006):

    cd Backend && .venv/bin/python scripts/seed.py

Idempotent: re-running updates rather than duplicates. Creates the five demo
accounts (password: Assetflow@123), master data, and the exact scenario the
judge demo walks through (allocated laptop, bookable Room B2 with a 9-10
booking today, an overdue allocation, an open audit cycle).
"""

import sys
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from supabase_auth.errors import AuthApiError  # noqa: E402

from database.supabase import get_service_client  # noqa: E402

PASSWORD = "Assetflow@123"

USERS = [
    {"email": "admin@assetflow.dev", "full_name": "Aditi Rao", "role": "admin", "department": "Operations"},
    {"email": "manager@assetflow.dev", "full_name": "Vikram Mehta", "role": "asset_manager", "department": "Operations"},
    {"email": "head.eng@assetflow.dev", "full_name": "Sneha Iyer", "role": "department_head", "department": "Engineering"},
    {"email": "priya@assetflow.dev", "full_name": "Priya Sharma", "role": "employee", "department": "Engineering"},
    {"email": "raj@assetflow.dev", "full_name": "Raj Patel", "role": "employee", "department": "Engineering"},
]


def ensure_user(client, email: str, full_name: str) -> str:
    try:
        result = client.auth.admin.create_user(
            {
                "email": email,
                "password": PASSWORD,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name},
            }
        )
        print(f"  created auth user {email}")
        return result.user.id
    except AuthApiError as exc:
        if "already" not in exc.message.lower():
            raise
        existing = client.table("profiles").select("id").eq("email", email).limit(1).execute()
        print(f"  auth user {email} already exists")
        return existing.data[0]["id"]


def upsert(client, table: str, match: dict, values: dict) -> str:
    query = client.table(table).select("id")
    for key, value in match.items():
        query = query.eq(key, value)
    found = query.limit(1).execute()
    if found.data:
        client.table(table).update(values).eq("id", found.data[0]["id"]).execute()
        return found.data[0]["id"]
    created = client.table(table).insert({**match, **values}).execute()
    return created.data[0]["id"]


def main() -> None:
    client = get_service_client()

    print("Departments & categories (db/006 also seeds these)...")
    departments = {}
    for name, description in [
        ("Engineering", "Product and platform engineering"),
        ("Operations", "Facilities and operations"),
        ("HR", "People team"),
    ]:
        departments[name] = upsert(client, "departments", {"name": name}, {"description": description})
    client.table("departments").update(
        {"parent_department_id": departments["Operations"]}
    ).eq("id", departments["HR"]).execute()

    categories = {}
    for name, description, fields in [
        ("Electronics", "Laptops, monitors, phones",
         [{"key": "warranty_months", "label": "Warranty (months)", "type": "number", "required": False}]),
        ("Furniture", "Desks, chairs, storage", []),
        ("Vehicles", "Company vehicles",
         [{"key": "registration_no", "label": "Registration No.", "type": "text", "required": False}]),
        ("Meeting Rooms", "Bookable shared rooms", []),
    ]:
        categories[name] = upsert(client, "asset_categories", {"name": name},
                                  {"description": description, "custom_fields": fields})

    print("Users...")
    user_ids = {}
    for user in USERS:
        user_id = ensure_user(client, user["email"], user["full_name"])
        user_ids[user["email"]] = user_id
        client.table("profiles").update(
            {"role": user["role"], "department_id": departments[user["department"]],
             "full_name": user["full_name"]}
        ).eq("id", user_id).execute()
    client.table("departments").update(
        {"head_id": user_ids["head.eng@assetflow.dev"]}
    ).eq("id", departments["Engineering"]).execute()

    manager = user_ids["manager@assetflow.dev"]
    priya = user_ids["priya@assetflow.dev"]
    raj = user_ids["raj@assetflow.dev"]

    print("Assets...")
    def asset(name, category, **kw):
        values = {
            "category_id": categories[category],
            "condition": kw.pop("condition", "good"),
            "created_by": manager,
            **kw,
        }
        return upsert(client, "assets", {"name": name}, values)

    macbook = asset("MacBook Pro 14", "Electronics", serial_number="C02XYZPRIYA",
                    acquisition_date="2025-11-01", acquisition_cost=185000,
                    location="HQ - Floor 2", department_id=departments["Engineering"],
                    custom_field_values={"warranty_months": 24}, condition="new")
    dell = asset("Dell Latitude 7440", "Electronics", serial_number="DL7440RAJ",
                 acquisition_date="2024-06-15", acquisition_cost=95000,
                 location="HQ - Floor 2", department_id=departments["Engineering"])
    old_thinkpad = asset("ThinkPad T480 (spare)", "Electronics", serial_number="TP480OLD",
                         acquisition_date="2021-01-10", acquisition_cost=70000,
                         location="HQ - Storage", condition="poor")
    monitor = asset("LG 27\" 4K Monitor", "Electronics", serial_number="LG27UK",
                    acquisition_date="2025-02-01", acquisition_cost=32000,
                    location="HQ - Floor 2")
    chair = asset("Herman Miller Aeron", "Furniture", acquisition_date="2023-08-20",
                  acquisition_cost=60000, location="HQ - Floor 1")
    desk = asset("Standing Desk", "Furniture", acquisition_date="2023-08-20",
                 acquisition_cost=25000, location="HQ - Floor 1")
    room_b2 = asset("Room B2", "Meeting Rooms", location="HQ - Floor 2 - B Wing",
                    is_bookable=True)
    asset("Room A1", "Meeting Rooms", location="HQ - Floor 1 - A Wing", is_bookable=True)
    asset("Innova Crysta", "Vehicles", location="HQ - Basement",
          acquisition_date="2022-03-01", acquisition_cost=2400000, is_bookable=True,
          custom_field_values={"registration_no": "KA-01-AB-1234"})
    projector = asset("Epson Projector", "Electronics", serial_number="EPSPROJ1",
                      acquisition_date="2024-11-11", acquisition_cost=55000,
                      location="HQ - Floor 1", is_bookable=True)

    print("Scenario data...")
    def ensure_active_allocation(asset_id, employee_id, expected_return=None):
        active = (
            client.table("allocations").select("id").eq("asset_id", asset_id)
            .eq("status", "active").limit(1).execute()
        )
        if active.data:
            return active.data[0]["id"]
        row = client.rpc("allocate_asset", {
            "p_asset_id": asset_id, "p_employee_id": employee_id,
            "p_department_id": None, "p_allocated_by": manager,
            "p_expected_return_date": expected_return, "p_notes": "Seeded",
        }).execute()
        data = row.data[0] if isinstance(row.data, list) else row.data
        return data["id"]

    # Priya holds the MacBook (the double-allocation demo target).
    ensure_active_allocation(macbook, priya, (date.today() + timedelta(days=30)).isoformat())
    # Raj holds the Dell — already overdue (feeds dashboard + notifications).
    ensure_active_allocation(dell, raj, (date.today() - timedelta(days=3)).isoformat())

    # Room B2 booked today 09:00-10:00 UTC (the overlap demo target).
    booking_start = datetime.combine(date.today(), time(9, 0), tzinfo=timezone.utc)
    existing = (
        client.table("bookings").select("id").eq("asset_id", room_b2)
        .eq("status", "confirmed").gte("start_time", booking_start.isoformat())
        .limit(1).execute()
    )
    if not existing.data:
        try:
            client.table("bookings").insert({
                "asset_id": room_b2, "booked_by": raj,
                "start_time": booking_start.isoformat(),
                "end_time": (booking_start + timedelta(hours=1)).isoformat(),
                "purpose": "Sprint planning",
            }).execute()
        except Exception:
            print("  booking already exists (overlap constraint) — fine")

    # A pending maintenance request on the projector.
    pending = (
        client.table("maintenance_requests").select("id").eq("asset_id", projector)
        .eq("status", "pending").limit(1).execute()
    )
    if not pending.data:
        client.table("maintenance_requests").insert({
            "asset_id": projector, "raised_by": priya, "title": "Lamp flickering",
            "description": "Flickers after ~20 minutes of use.", "priority": "high",
        }).execute()

    # An open audit cycle over Engineering with Sneha as auditor.
    cycle = (
        client.table("audit_cycles").select("id").eq("name", "Q3 Engineering Audit")
        .limit(1).execute()
    )
    if not cycle.data:
        created = client.table("audit_cycles").insert({
            "name": "Q3 Engineering Audit",
            "department_id": departments["Engineering"],
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=7)).isoformat(),
            "created_by": user_ids["admin@assetflow.dev"],
        }).execute()
        cycle_id = created.data[0]["id"]
        client.table("audit_auditors").insert(
            {"cycle_id": cycle_id, "auditor_id": user_ids["head.eng@assetflow.dev"]}
        ).execute()
        in_scope = (
            client.table("assets").select("id")
            .eq("department_id", departments["Engineering"])
            .neq("status", "disposed").execute()
        )
        client.table("audit_records").insert(
            [{"cycle_id": cycle_id, "asset_id": row["id"]} for row in in_scope.data]
        ).execute()

    _ = (old_thinkpad, monitor, chair, desk)  # registered for reports variety
    print("\nDone. Demo accounts (password: Assetflow@123):")
    for user in USERS:
        print(f"  {user['role']:<16} {user['email']}")


if __name__ == "__main__":
    main()
