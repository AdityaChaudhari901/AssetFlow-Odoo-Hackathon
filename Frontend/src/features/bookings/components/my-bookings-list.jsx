import { CalendarClock, CalendarX2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { fmtDateTime } from "@/lib/format";

function BookingActions({ booking, onReschedule, onCancel }) {
  if (booking.display_status !== "upcoming") return null;
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => onReschedule(booking)}><CalendarClock aria-hidden="true" /> Reschedule</Button>
      <Button type="button" size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => onCancel(booking)}><CalendarX2 aria-hidden="true" /> Cancel</Button>
    </div>
  );
}

export function MyBookingsList({ query, onReschedule, onCancel }) {
  const rows = query.data?.data ?? [];
  const columns = [
    { key: "resource", header: "Resource", render: (row) => <div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div> },
    { key: "time", header: "Time", render: (row) => <div className="text-sm"><p>{fmtDateTime(row.start_time)}</p><p className="text-xs text-muted-foreground">to {fmtDateTime(row.end_time)}</p></div> },
    { key: "purpose", header: "Purpose", render: (row) => row.purpose || <span className="text-muted-foreground">Not provided</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge kind="booking" value={row.display_status} /> },
    { key: "actions", header: <span className="sr-only">Actions</span>, cellClassName: "text-right", render: (row) => <BookingActions booking={row} onReschedule={onReschedule} onCancel={onCancel} /> },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption="My resource bookings"
      loading={query.isLoading}
      error={query.error}
      onRetry={query.refetch}
      emptyTitle="You have no bookings"
      emptyDescription="Book a shared resource and it will appear here."
      renderMobileCard={(row) => (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{row.asset.name}</p><p className="text-xs text-muted-foreground">{row.asset.asset_tag}</p></div><StatusBadge kind="booking" value={row.display_status} /></div>
            <div className="text-sm"><p>{fmtDateTime(row.start_time)}</p><p className="text-muted-foreground">to {fmtDateTime(row.end_time)}</p></div>
            {row.purpose ? <p className="text-sm text-muted-foreground">{row.purpose}</p> : null}
            <BookingActions booking={row} onReschedule={onReschedule} onCancel={onCancel} />
          </CardContent>
        </Card>
      )}
    />
  );
}
