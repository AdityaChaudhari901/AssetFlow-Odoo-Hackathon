import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

const columns = [
  { key: "asset", header: "Asset", render: (row) => <div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div> },
  { key: "condition", header: "Condition", render: (row) => <StatusBadge kind="condition" value={row.asset.condition} /> },
  { key: "location", header: "Location", render: (row) => row.asset.location || "—" },
  { key: "reasons", header: "Reasons", render: (row) => <div className="flex flex-wrap gap-1.5">{row.reasons.map((reason) => <span key={reason} className="rounded-md border border-asset-maintenance-border bg-asset-maintenance-surface px-2 py-1 text-xs text-asset-maintenance">{reason}</span>)}</div> },
];

export function AttentionTable({ query }) {
  return <DataTable columns={columns} rows={query.data?.data ?? []} loading={query.isLoading} error={query.error} onRetry={query.refetch} caption="Assets requiring attention" emptyTitle="No assets need attention" emptyDescription="No maintenance, condition, or retirement flags were found." renderMobileCard={(row) => <div className="rounded-xl border border-border/80 bg-card p-4"><div className="flex justify-between gap-3"><p className="font-medium">{row.asset.asset_tag} · {row.asset.name}</p><StatusBadge kind="condition" value={row.asset.condition} /></div><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{row.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></div>} />;
}
