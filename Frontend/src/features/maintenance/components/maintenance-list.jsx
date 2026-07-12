import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { RelativeTime } from "@/components/shared/relative-time";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserChip } from "@/components/shared/user-chip";

export function MaintenanceList({ query, page, onPageChange, onSelect }) {
  const rows = query.data?.data ?? [];
  const columns = [
    {
      key: "asset",
      header: "Asset",
      render: (row) => <div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div>,
    },
    { key: "title", header: "Issue", render: (row) => <span className="line-clamp-2 max-w-sm">{row.title}</span> },
    { key: "priority", header: "Priority", render: (row) => <StatusBadge kind="priority" value={row.priority} /> },
    { key: "status", header: "Status", render: (row) => <StatusBadge kind="maintenance" value={row.status} /> },
    { key: "raisedBy", header: "Raised by", render: (row) => <UserChip user={row.raised_by} compact /> },
    { key: "age", header: "Age", render: (row) => <RelativeTime value={row.created_at} className="whitespace-nowrap text-sm text-muted-foreground" /> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption="Maintenance requests"
      loading={query.isLoading}
      error={query.error}
      onRetry={query.refetch}
      onRowClick={onSelect}
      page={page}
      limit={query.data?.meta?.limit ?? 20}
      total={query.data?.meta?.total ?? rows.length}
      onPageChange={onPageChange}
      emptyTitle="No maintenance requests"
      emptyDescription="Change the filters or raise the first request for an asset issue."
      renderMobileCard={(row) => (
        <button type="button" className="w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onSelect(row)}>
          <Card className="transition-colors hover:border-primary/40">
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div><StatusBadge kind="priority" value={row.priority} /></div>
              <p className="text-sm font-medium">{row.title}</p>
              <div className="flex flex-wrap items-center justify-between gap-3"><StatusBadge kind="maintenance" value={row.status} /><RelativeTime value={row.created_at} className="text-xs text-muted-foreground" /></div>
              <UserChip user={row.raised_by} compact />
            </CardContent>
          </Card>
        </button>
      )}
    />
  );
}
