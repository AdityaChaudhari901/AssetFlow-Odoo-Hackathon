import { ClipboardCheck, Wrench } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate } from "@/lib/format";

function Timeline({ rows, render, emptyTitle }) {
  if (!rows?.length) {
    return <EmptyState compact title={emptyTitle} description="New lifecycle events will appear here automatically." />;
  }

  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {rows.map((row) => (
        <li key={row.id} className="relative border-b border-border/60 py-4 last:border-b-0">
          <span className="absolute -left-[1.72rem] top-5 size-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
          {render(row)}
        </li>
      ))}
    </ol>
  );
}

export function AssetHistoryTabs({ history, loading = false }) {
  if (loading) {
    return <Skeleton className="h-72 rounded-xl" />;
  }

  return (
    <Tabs defaultValue="allocations" className="rounded-xl border border-border/80 bg-card p-4 sm:p-5">
      <TabsList variant="line" className="h-auto w-full justify-start overflow-x-auto">
        <TabsTrigger value="allocations" className="min-h-10">Allocation history</TabsTrigger>
        <TabsTrigger value="maintenance" className="min-h-10">Maintenance history</TabsTrigger>
        <TabsTrigger value="audits" className="min-h-10">Audit history</TabsTrigger>
      </TabsList>

      <TabsContent value="allocations" className="pt-4">
        <Timeline
          rows={history?.allocations}
          emptyTitle="No custody history yet"
          render={(row) => (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Allocated to {row.holder?.name ?? row.holder?.full_name ?? "Unknown holder"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{fmtDate(row.allocated_at)} · expected {fmtDate(row.expected_return_date)}</p>
              </div>
              <StatusBadge kind="allocation" value={row.is_overdue ? "overdue" : row.status} />
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="maintenance" className="pt-4">
        <Timeline
          rows={history?.maintenance}
          emptyTitle="No maintenance history"
          render={(row) => (
            <div className="flex items-start gap-3">
              <Wrench className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{row.title}</p>
                  <StatusBadge kind="maintenance" value={row.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground"><RelativeTime value={row.created_at} /></p>
              </div>
            </div>
          )}
        />
      </TabsContent>

      <TabsContent value="audits" className="pt-4">
        <Timeline
          rows={history?.audits}
          emptyTitle="No audit evidence yet"
          render={(row) => (
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-0.5 size-4 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{row.audit_name}</p>
                  <StatusBadge kind="audit" value={row.result} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{row.audited_at ? <RelativeTime value={row.audited_at} /> : "Pending verification"}</p>
              </div>
            </div>
          )}
        />
      </TabsContent>
    </Tabs>
  );
}
