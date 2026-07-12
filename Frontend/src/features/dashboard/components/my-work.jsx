import { CalendarDays, Package } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAllocations } from "@/hooks/queries/use-allocations";
import { useBookings } from "@/hooks/queries/use-bookings";
import { fmtDate, fmtDateTime } from "@/lib/format";

function WorkPanel({ title, to, loading, children }) {
  return <section className="rounded-xl border border-border/80 bg-card"><div className="flex items-center justify-between border-b border-border/70 px-5 py-4"><h2 className="font-semibold">{title}</h2><Link to={to} className="text-sm font-medium text-primary underline-offset-4 hover:underline">View all</Link></div><div className="p-4">{loading ? <Skeleton className="h-24 w-full" /> : children}</div></section>;
}

export function MyWork() {
  const allocations = useAllocations({ mine: true, status: "active", page: 1, limit: 3 });
  const bookings = useBookings({ mine: true, page: 1, limit: 3 });
  const allocationRows = allocations.data?.data ?? [];
  const bookingRows = bookings.data?.data ?? [];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <WorkPanel title="My assigned assets" to="/allocations?mine=true" loading={allocations.isLoading}>
        {allocations.error ? <QueryErrorState error={allocations.error} onRetry={allocations.refetch} compact /> : allocationRows.length ? <div className="divide-y divide-border/70">{allocationRows.map((item) => <div key={item.id} className="flex min-h-16 items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{item.asset.asset_tag} · {item.asset.name}</p><p className="mt-1 text-xs text-muted-foreground">Expected return {fmtDate(item.expected_return_date)}</p></div><StatusBadge kind="allocation" value={item.is_overdue ? "overdue" : "active"} /></div>)}</div> : <EmptyState compact icon={Package} title="No assigned assets" description="Assets allocated to you will appear here." />}
      </WorkPanel>
      <WorkPanel title="My bookings" to="/bookings?mine=true" loading={bookings.isLoading}>
        {bookings.error ? <QueryErrorState error={bookings.error} onRetry={bookings.refetch} compact /> : bookingRows.length ? <div className="divide-y divide-border/70">{bookingRows.map((item) => <div key={item.id} className="flex min-h-16 items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{item.asset.name}</p><p className="mt-1 text-xs text-muted-foreground">{fmtDateTime(item.start_time)}</p></div><StatusBadge kind="booking" value={item.display_status} /></div>)}</div> : <EmptyState compact icon={CalendarDays} title="No bookings" description="Your upcoming resource bookings will appear here." />}
      </WorkPanel>
    </div>
  );
}
