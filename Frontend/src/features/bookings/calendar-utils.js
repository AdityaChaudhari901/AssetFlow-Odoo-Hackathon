import { addDays, format, startOfWeek } from "date-fns";

export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 21;
export const SLOT_HEIGHT = 56;

export function weekStart(value = new Date()) {
  return startOfWeek(value, { weekStartsOn: 1 });
}

export function weekDays(start) {
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function dayKey(date) {
  return format(date, "yyyy-MM-dd");
}

export function toLocalInputParts(iso) {
  const date = new Date(iso);
  return { date: format(date, "yyyy-MM-dd"), time: format(date, "HH:mm") };
}

export function toIso(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function overlaps(leftStart, leftEnd, rightStart, rightEnd) {
  return new Date(leftStart) < new Date(rightEnd) && new Date(rightStart) < new Date(leftEnd);
}

export function bookingPosition(booking) {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const startMinutes = start.getHours() * 60 + start.getMinutes() - DAY_START_HOUR * 60;
  const durationMinutes = Math.max(15, (end - start) / 60_000);
  return {
    top: Math.max(0, (startMinutes / 60) * SLOT_HEIGHT),
    height: Math.max(28, (durationMinutes / 60) * SLOT_HEIGHT),
  };
}
