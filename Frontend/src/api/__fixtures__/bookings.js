import { ApiError } from "@/api/client";
import { fixtureActor, matchesFixtureIdentity } from "@/api/__fixtures__/session";
import {
  fixtureDb,
  fixtureEnvelope,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
} from "@/api/__fixtures__/store";

function displayStatus(booking) {
  if (booking.status === "cancelled" || booking.display_status === "cancelled") return "cancelled";
  const now = Date.now();
  const start = new Date(booking.start_time).getTime();
  const end = new Date(booking.end_time).getTime();
  if (now < start) return "upcoming";
  if (now < end) return "ongoing";
  return "completed";
}

function overlap(startA, endA, startB, endB) {
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
}

function conflictFor(payload, excludedId) {
  return fixtureDb.bookings.find(
    (booking) =>
      booking.id !== excludedId &&
      booking.asset.id === payload.asset_id &&
      displayStatus(booking) !== "cancelled" &&
      overlap(payload.start_time, payload.end_time, booking.start_time, booking.end_time),
  );
}

function throwOverlap(conflict) {
  throw new ApiError({
    code: "BOOKING_OVERLAP",
    message: "The selected time overlaps another booking.",
    status: 409,
    details: {
      conflicting_booking: {
        id: conflict.id,
        start_time: conflict.start_time,
        end_time: conflict.end_time,
        booked_by: conflict.booked_by,
      },
    },
  });
}

export async function fixtureListBookableResources(params = {}) {
  const search = String(params.search ?? "").trim().toLowerCase();
  let rows = fixtureDb.assets.filter(
    (asset) =>
      asset.is_bookable &&
      !["under_maintenance", "lost", "retired", "disposed"].includes(asset.status),
  );
  if (search) {
    rows = rows.filter((asset) =>
      [asset.asset_tag, asset.name, asset.category?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }
  return fixtureResult(paginateFixture(rows, params));
}

export async function fixtureListBookings(params = {}) {
  let rows = fixtureDb.bookings.map((booking) => ({
    ...booking,
    display_status: displayStatus(booking),
    is_mine: matchesFixtureIdentity(booking.booked_by),
  }));
  if (params.asset_id) rows = rows.filter((row) => row.asset.id === params.asset_id);
  if (params.mine === true || params.mine === "true") rows = rows.filter((row) => row.is_mine);
  if (params.status) {
    rows = rows.filter((row) =>
      params.status === "confirmed"
        ? row.display_status !== "cancelled"
        : row.display_status === params.status,
    );
  }
  if (params.from && params.to) {
    rows = rows.filter((row) => overlap(row.start_time, row.end_time, params.from, params.to));
  }
  rows.sort((left, right) => new Date(left.start_time) - new Date(right.start_time));
  return fixtureResult(paginateFixture(rows, params));
}

export async function fixtureCreateBooking(payload) {
  const asset = fixtureDb.assets.find((item) => item.id === payload.asset_id);
  if (!asset?.is_bookable || ["under_maintenance", "lost", "retired", "disposed"].includes(asset.status)) {
    throw new ApiError({
      code: "ASSET_NOT_BOOKABLE",
      message: "This resource is not currently available for booking.",
      status: 409,
    });
  }
  const conflict = conflictFor(payload);
  if (conflict) throwOverlap(conflict);
  const booking = {
    id: nextFixtureId("booking"),
    asset: { id: asset.id, asset_tag: asset.asset_tag, name: asset.name },
    booked_by: fixtureActor(),
    start_time: payload.start_time,
    end_time: payload.end_time,
    purpose: payload.purpose || null,
    department_id: payload.department_id || null,
    status: "confirmed",
    display_status: "upcoming",
    is_mine: true,
  };
  fixtureDb.bookings.push(booking);
  return fixtureResult(fixtureEnvelope(booking));
}

export async function fixtureRescheduleBooking(id, payload) {
  const booking = fixtureDb.bookings.find((row) => row.id === id);
  if (!booking || displayStatus(booking) !== "upcoming") {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This booking can no longer be rescheduled.",
      status: 409,
    });
  }
  const conflict = conflictFor({ ...payload, asset_id: booking.asset.id }, id);
  if (conflict) throwOverlap(conflict);
  booking.start_time = payload.start_time;
  booking.end_time = payload.end_time;
  booking.display_status = displayStatus(booking);
  return fixtureResult(fixtureEnvelope(booking));
}

export async function fixtureCancelBooking(id, payload = {}) {
  const booking = fixtureDb.bookings.find((row) => row.id === id);
  if (!booking || displayStatus(booking) !== "upcoming") {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This booking was already cancelled.",
      status: 409,
    });
  }
  booking.status = "cancelled";
  booking.display_status = "cancelled";
  booking.cancellation_reason = payload.reason || null;
  return fixtureResult(fixtureEnvelope(booking));
}
