import { fixtureDb, fixtureEnvelope, fixtureResult } from "@/api/__fixtures__/store";

function datePart(value) {
  return value ? value.slice(0, 10) : null;
}

export async function getDashboardKpisFixture() {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingLimit = new Date();
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const upcomingDate = upcomingLimit.toISOString().slice(0, 10);
  const activeAllocations = fixtureDb.allocations.filter((item) => item.status === "active");
  const data = {
    assets_available: fixtureDb.assets.filter((item) => item.status === "available").length,
    assets_allocated: fixtureDb.assets.filter((item) => item.status === "allocated").length,
    maintenance_active: fixtureDb.maintenance.filter((item) => !["resolved", "rejected"].includes(item.status)).length,
    active_bookings_today: fixtureDb.bookings.filter((item) => datePart(item.start_time) === today && item.display_status !== "cancelled").length,
    pending_transfers: fixtureDb.transfers.filter((item) => item.status === "pending").length,
    upcoming_returns: activeAllocations.filter((item) => item.expected_return_date >= today && item.expected_return_date <= upcomingDate).length,
    overdue_returns: activeAllocations.filter((item) => item.is_overdue).length,
  };
  return fixtureResult(fixtureEnvelope(data));
}

export async function getDashboardReturnsFixture(type) {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingLimit = new Date();
  upcomingLimit.setDate(upcomingLimit.getDate() + 7);
  const upcomingDate = upcomingLimit.toISOString().slice(0, 10);
  const rows = fixtureDb.allocations.filter((item) =>
    type === "overdue"
      ? item.status === "active" && item.is_overdue
      : item.status === "active" &&
        !item.is_overdue &&
        item.expected_return_date >= today &&
        item.expected_return_date <= upcomingDate,
  );
  return fixtureResult(fixtureEnvelope(rows));
}
