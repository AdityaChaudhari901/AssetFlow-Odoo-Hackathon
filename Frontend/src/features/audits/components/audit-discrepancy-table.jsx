import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";

const columns = [
  { key: "asset", header: "Asset", render: (row) => <div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div> },
  { key: "location", header: "Expected location", render: (row) => row.asset.location || "—" },
  { key: "result", header: "Finding", render: (row) => <StatusBadge kind="audit" value={row.result} /> },
  { key: "notes", header: "Evidence", render: (row) => row.notes || "—" },
];

export function AuditDiscrepancyTable({ query }) {
  const rows = query.data?.data ?? [];

  function exportCsv() {
    const csvCell = (value) => {
      const raw = String(value ?? "");
      const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
      return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };
    const csv = [
      ["Asset tag", "Asset", "Expected location", "Finding", "Evidence"],
      ...rows.map((row) => [
        row.asset.asset_tag,
        row.asset.name,
        row.asset.location,
        row.result,
        row.notes,
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `assetflow-audit-discrepancies-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={query.isLoading || Boolean(query.error) || rows.length === 0}
          onClick={exportCsv}
        >
          <Download aria-hidden="true" />
          Export CSV
        </Button>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        loading={query.isLoading}
        error={query.error}
        onRetry={query.refetch}
        caption="Audit discrepancies"
        emptyTitle="No discrepancies recorded"
        emptyDescription="Verified assets remain in the audit record without appearing in this exception report."
        renderMobileCard={(row) => (
          <div className="rounded-xl border border-border/80 bg-card p-4">
            <div className="flex justify-between gap-3"><p className="font-medium">{row.asset.name}</p><StatusBadge kind="audit" value={row.result} /></div>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p>
            <p className="mt-3 text-sm text-muted-foreground">{row.notes || "No evidence notes."}</p>
          </div>
        )}
      />
    </div>
  );
}
