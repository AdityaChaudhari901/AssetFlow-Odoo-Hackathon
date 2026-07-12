import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { CalendarDays, Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { fmtTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  bookingPosition,
  DAY_END_HOUR,
  DAY_START_HOUR,
  dayKey,
  SLOT_HEIGHT,
  weekDays,
} from "@/features/bookings/calendar-utils";

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, index) => DAY_START_HOUR + index);

function bookingLabel(booking) {
  return booking.purpose || booking.booked_by?.full_name || "Reserved";
}

function isOwnedBy(booking, currentUserId) {
  return booking.is_mine ?? Boolean(currentUserId && booking.booked_by?.id === currentUserId);
}

function bookingClassName(booking, currentUserId) {
  const statusClass = {
    upcoming: "border-asset-allocated-border bg-asset-allocated-surface text-asset-allocated",
    ongoing: "border-success-border bg-success-surface text-success",
    completed: "border-border bg-muted text-muted-foreground",
    cancelled: "border-border bg-muted text-muted-foreground line-through",
  }[booking.display_status] ?? "border-border bg-muted text-muted-foreground";
  return cn(statusClass, isOwnedBy(booking, currentUserId) && "ring-1 ring-primary/60");
}

export function BookingCalendar({ week, query, resource, currentUserId, onSelectSlot, onSelectBooking }) {
  const days = useMemo(() => weekDays(week), [week]);
  const [mobileDay, setMobileDay] = useState(() => {
    const today = days.find((day) => isSameDay(day, new Date()));
    return dayKey(today ?? days[0]);
  });
  useEffect(() => {
    setMobileDay((current) => {
      if (days.some((day) => dayKey(day) === current)) return current;
      const today = days.find((day) => isSameDay(day, new Date()));
      return dayKey(today ?? days[0]);
    });
  }, [days]);
  const bookings = query.data?.data ?? [];
  const byDay = useMemo(
    () => Object.fromEntries(days.map((day) => [dayKey(day), bookings.filter((row) => isSameDay(new Date(row.start_time), day))])),
    [bookings, days],
  );

  if (!resource) {
    return <EmptyState icon={CalendarDays} title="Choose a resource" description="Select a room, vehicle, or shared asset to view its availability." />;
  }
  if (query.isLoading) return <Skeleton className="h-[620px] rounded-xl" />;
  if (query.error) return <QueryErrorState error={query.error} onRetry={query.refetch} />;

  const selectedMobileDay = days.find((day) => dayKey(day) === mobileDay) ?? days[0];

  return (
    <div className="rounded-xl border border-border/80 bg-card">
      <div className="border-b border-border/70 px-4 py-3">
        <p className="font-medium">{resource.asset_tag} · {resource.name}</p>
        <p className="text-xs text-muted-foreground">Availability shown from 07:00 to 21:00</p>
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b border-border/70 bg-muted/25">
            <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
            {days.map((day) => (
              <div key={dayKey(day)} className={cn("border-l border-border/70 p-3 text-center", isSameDay(day, new Date()) && "bg-primary/5")}>
                <p className="text-xs text-muted-foreground">{format(day, "EEE")}</p>
                <p className="font-semibold">{format(day, "d MMM")}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))]">
            <div className="relative" style={{ height: HOURS.length * SLOT_HEIGHT }}>
              {HOURS.map((hour, index) => (
                <span key={hour} className="absolute right-3 -translate-y-2 text-xs tabular-nums text-muted-foreground" style={{ top: index * SLOT_HEIGHT }}>
                  {String(hour).padStart(2, "0")}:00
                </span>
              ))}
            </div>
            {days.map((day) => (
              <div key={dayKey(day)} className={cn("relative border-l border-border/70", isSameDay(day, new Date()) && "bg-primary/[0.025]")} style={{ height: HOURS.length * SLOT_HEIGHT }}>
                {HOURS.map((hour, index) => (
                  <Button
                    key={hour}
                    type="button"
                    variant="ghost"
                    className="absolute inset-x-0 h-14 rounded-none border-t border-border/60 hover:bg-primary/5 focus-visible:z-20"
                    style={{ top: index * SLOT_HEIGHT }}
                    aria-label={`Book ${resource.name} on ${format(day, "EEEE d MMMM")} at ${String(hour).padStart(2, "0")}:00`}
                    onClick={() => onSelectSlot({ date: dayKey(day), startTime: `${String(hour).padStart(2, "0")}:00`, endTime: `${String(hour + 1).padStart(2, "0")}:00` })}
                  />
                ))}
                {(byDay[dayKey(day)] ?? []).map((booking) => {
                  const position = bookingPosition(booking);
                  const manageable = isOwnedBy(booking, currentUserId) && booking.display_status === "upcoming";
                  return (
                    <button
                      key={booking.id}
                      type="button"
                      className={cn(
                        "absolute inset-x-1 z-10 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        !manageable && "cursor-default",
                        bookingClassName(booking, currentUserId),
                      )}
                      style={{ top: position.top + 2, height: Math.max(24, position.height - 4) }}
                      onClick={() => onSelectBooking(booking)}
                      disabled={!manageable}
                      aria-label={`${bookingLabel(booking)}, ${fmtTime(booking.start_time)} to ${fmtTime(booking.end_time)}`}
                    >
                      <span className="block truncate font-semibold">{fmtTime(booking.start_time)} · {bookingLabel(booking)}</span>
                      {position.height > 42 ? <span className="block truncate opacity-75">{booking.display_status === "ongoing" ? "Now · " : ""}{booking.booked_by?.full_name}</span> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 lg:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose agenda day">
          {days.map((day) => (
            <Button key={dayKey(day)} type="button" size="sm" variant={mobileDay === dayKey(day) ? "default" : "outline"} onClick={() => setMobileDay(dayKey(day))}>
              {format(day, "EEE d")}
            </Button>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full border-dashed"
          onClick={() => onSelectSlot({ date: dayKey(selectedMobileDay), startTime: "09:00", endTime: "10:00" })}
        >
          <CalendarDays aria-hidden="true" /> Book {format(selectedMobileDay, "EEEE")}
        </Button>
        {(byDay[dayKey(selectedMobileDay)] ?? []).length ? (
          <div className="space-y-3">
            {byDay[dayKey(selectedMobileDay)].map((booking) => (
              <Card key={booking.id} className="shadow-none">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{bookingLabel(booking)}</p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden="true" />{fmtTime(booking.start_time)}–{fmtTime(booking.end_time)}</p>
                    </div>
                    <StatusBadge kind="booking" value={booking.display_status} />
                  </div>
                  <p className="text-xs text-muted-foreground">Booked by {booking.booked_by?.full_name}</p>
                  {isOwnedBy(booking, currentUserId) && booking.display_status === "upcoming" ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => onSelectBooking(booking)}>Manage booking</Button>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState compact title="No bookings this day" description="The resource is free during its operating hours." />
        )}
      </div>
    </div>
  );
}
