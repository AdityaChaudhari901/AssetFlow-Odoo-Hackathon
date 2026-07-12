import { AlertTriangle, CalendarClock } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { fmtDate } from "@/lib/format";

export function ReturnQueue({ title, type, query }) {
  const rows = query.data?.data ?? [];
  return (
    <section className="rounded-xl border border-border/80 bg-card" aria-labelledby={`${type}-returns-title`}>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4">
        <h2 id={`${type}-returns-title`} className="font-semibold">{title}</h2>
        {type === "overdue" ? <AlertTriangle className="size-4 text-destructive" aria-hidden="true" /> : <CalendarClock className="size-4 text-primary" aria-hidden="true" />}
      </div>
      <div className="p-4">
        {query.isLoading ? <div className="space-y-3" role="status" aria-label={`Loading ${title.toLowerCase()}`}><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div> : null}
        {query.error ? <QueryErrorState error={query.error} onRetry={query.refetch} compact /> : null}
        {!query.error && !query.isLoading && rows.length === 0 ? <EmptyState compact title={type === "overdue" ? "No overdue returns" : "No upcoming returns"} description="The custody schedule is currently clear." /> : null}
        <div className="divide-y divide-border/70">
          {rows.map((allocation) => (
            <Link key={allocation.id} to={`/allocations?tab=${type === "overdue" ? "overdue" : "active"}`} className="flex min-h-16 items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{allocation.asset.asset_tag} · {allocation.asset.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{allocation.holder?.name ?? "Unassigned"} · due {fmtDate(allocation.expected_return_date)}</p></div>
              <StatusBadge kind="allocation" value={type === "overdue" ? "overdue" : "active"} label={type === "overdue" ? `${allocation.days_overdue ?? 0}d overdue` : "Upcoming"} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
