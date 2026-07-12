import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat("en-IN");

function toDate(value) {
  if (value instanceof Date) {
    return value;
  }

  if (!value) {
    return null;
  }

  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
}

export function fmtDate(value, fallback = "—") {
  const date = toDate(value);
  return date ? format(date, "dd MMM yyyy") : fallback;
}

export function fmtDateTime(value, fallback = "—") {
  const date = toDate(value);
  return date ? format(date, "dd MMM yyyy, h:mm a") : fallback;
}

export function fmtTime(value, fallback = "—") {
  const date = toDate(value);
  return date ? format(date, "h:mm a") : fallback;
}

export function fmtRelative(value, fallback = "—") {
  const date = toDate(value);

  if (!date) {
    return fallback;
  }

  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function fmtCurrency(value, fallback = "—") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? CURRENCY_FORMATTER.format(amount) : fallback;
}

export function fmtNumber(value, fallback = "0") {
  const number = Number(value);
  return Number.isFinite(number) ? NUMBER_FORMATTER.format(number) : fallback;
}

export function fmtDurationMinutes(minutes) {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const remainingMinutes = total % 60;

  if (!hours) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function titleCase(value = "") {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
