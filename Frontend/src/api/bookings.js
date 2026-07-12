import {
  fixtureCancelBooking,
  fixtureCreateBooking,
  fixtureListBookableResources,
  fixtureListBookings,
  fixtureRescheduleBooking,
} from "@/api/__fixtures__/bookings";
import { request } from "@/api/transport";

export const listBookableResources = (params, signal) =>
  request({ method: "get", url: "/assets", params: { ...params, is_bookable: true }, signal }, () =>
    fixtureListBookableResources(params),
  );

export const listBookings = (params, signal) =>
  request({ method: "get", url: "/bookings", params, signal }, () =>
    fixtureListBookings(params),
  );

export const createBooking = (payload) =>
  request({ method: "post", url: "/bookings", data: payload }, () =>
    fixtureCreateBooking(payload),
  );

export const rescheduleBooking = (id, payload) =>
  request({ method: "patch", url: `/bookings/${id}`, data: payload }, () =>
    fixtureRescheduleBooking(id, payload),
  );

export const cancelBooking = (id, payload) =>
  request({ method: "post", url: `/bookings/${id}/cancel`, data: payload }, () =>
    fixtureCancelBooking(id, payload),
  );
