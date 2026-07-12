import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserChip } from "@/components/shared/user-chip";
import { fmtDateTime } from "@/lib/format";

function Actions({ row, onApprove, onReject, pending, canReview }) {
  if (!canReview) return null;
  const actions = row.allowed_actions ?? [];
  return (
    <div className="flex justify-end gap-2">
      {actions.includes("reject") ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onReject(row)}>
          <X aria-hidden="true" /> Reject
        </Button>
      ) : null}
      {actions.includes("approve") ? (
        <Button size="sm" disabled={pending} onClick={() => onApprove(row)}>
          <Check aria-hidden="true" /> Approve
        </Button>
      ) : null}
    </div>
  );
}

export function TransferList({ query, page, onPageChange, onApprove, onReject, pending, canReview }) {
  const rows = query.data?.data ?? [];
  const columns = [
    {
      key: "asset",
      header: "Asset",
      render: (row) => <div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div>,
    },
    { key: "from", header: "From", render: (row) => <UserChip user={row.from_holder} compact /> },
    { key: "to", header: "To", render: (row) => <UserChip user={row.to_target} compact /> },
    { key: "requester", header: "Requested by", render: (row) => <UserChip user={row.requested_by} compact /> },
    { key: "reason", header: "Reason", render: (row) => <span className="block max-w-56 line-clamp-2 text-sm text-muted-foreground">{row.reason || "—"}</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge kind="transfer" value={row.status} /> },
    { key: "requested", header: "Requested", render: (row) => <span className="text-sm">{fmtDateTime(row.created_at)}</span> },
    { key: "actions", header: <span className="sr-only">Actions</span>, cellClassName: "text-right", render: (row) => <Actions row={row} onApprove={onApprove} onReject={onReject} pending={pending} canReview={canReview} /> },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption="Transfer requests"
      loading={query.isLoading}
      error={query.error}
      onRetry={query.refetch}
      page={page}
      limit={query.data?.meta?.limit ?? 20}
      total={query.data?.meta?.total ?? rows.length}
      onPageChange={onPageChange}
      emptyTitle="No transfer requests"
      emptyDescription="Pending transfer requests will appear here for review."
      renderMobileCard={(row) => (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-medium">{row.asset.name}</p><p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p></div>
              <StatusBadge kind="transfer" value={row.status} />
            </div>
            <div className="grid gap-3 text-sm"><p><span className="text-muted-foreground">From:</span> {row.from_holder.name}</p><p><span className="text-muted-foreground">To:</span> {row.to_target.name}</p><p><span className="text-muted-foreground">Requested by:</span> {row.requested_by?.full_name ?? row.requested_by?.name ?? "—"}</p><p><span className="text-muted-foreground">Requested:</span> {fmtDateTime(row.created_at)}</p></div>
            {row.reason ? <p className="text-sm text-muted-foreground">{row.reason}</p> : null}
            <Actions row={row} onApprove={onApprove} onReject={onReject} pending={pending} canReview={canReview} />
          </CardContent>
        </Card>
      )}
    />
  );
}
