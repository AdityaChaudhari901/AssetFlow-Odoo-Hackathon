import { ArrowLeftRight, CheckCircle2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserChip } from "@/components/shared/user-chip";
import { fmtDate, fmtDateTime } from "@/lib/format";

function AllocationActions({ row, onRequestReturn, onCheckIn, onTransfer, pending, canManage }) {
  const actions = row.allowed_actions ?? [];
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {actions.includes("request_return") && !row.return_requested ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onRequestReturn(row)}>
          <RotateCcw aria-hidden="true" /> Request return
        </Button>
      ) : null}
      {actions.includes("request_transfer") ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => onTransfer(row)}>
          <ArrowLeftRight aria-hidden="true" /> Transfer
        </Button>
      ) : null}
      {canManage && actions.includes("check_in") ? (
        <Button size="sm" disabled={pending} onClick={() => onCheckIn(row)}>
          <CheckCircle2 aria-hidden="true" /> Check in
        </Button>
      ) : null}
    </div>
  );
}

export function AllocationList({ query, page, onPageChange, onRequestReturn, onCheckIn, onTransfer, pending, canManage }) {
  const rows = query.data?.data ?? [];
  const columns = [
    {
      key: "asset",
      header: "Asset",
      render: (row) => (
        <div>
          <p className="font-medium">{row.asset.name}</p>
          <p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p>
        </div>
      ),
    },
    {
      key: "holder",
      header: "Holder",
      render: (row) => <UserChip user={row.holder} secondary={row.holder.department_name} compact />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge
            kind="allocation"
            value={row.is_overdue ? "overdue" : row.status}
            label={row.is_overdue ? `${row.days_overdue ?? 0}d overdue` : undefined}
          />
          {row.return_requested ? <StatusBadge kind="allocation" value="return_requested" /> : null}
        </div>
      ),
    },
    {
      key: "dates",
      header: "Custody dates",
      render: (row) => (
        <div className="text-sm">
          <p>Since {fmtDate(row.allocated_at)}</p>
          <p className={row.is_overdue ? "text-destructive" : "text-muted-foreground"}>
            Due {fmtDate(row.expected_return_date, "Not set")}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      cellClassName: "text-right",
      render: (row) => (
        <AllocationActions
          row={row}
          onRequestReturn={onRequestReturn}
          onCheckIn={onCheckIn}
          onTransfer={onTransfer}
          pending={pending}
          canManage={canManage}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      caption="Asset allocations"
      loading={query.isLoading}
      error={query.error}
      onRetry={query.refetch}
      page={page}
      limit={query.data?.meta?.limit ?? 20}
      total={query.data?.meta?.total ?? rows.length}
      onPageChange={onPageChange}
      getRowClassName={(row) => row.is_overdue ? "bg-destructive/5" : undefined}
      emptyTitle="No allocations in this view"
      emptyDescription="Try another custody status or allocate an available asset."
      renderMobileCard={(row) => (
        <Card className={row.is_overdue ? "border-destructive/30 bg-destructive/5" : undefined}>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{row.asset.name}</p>
                <p className="text-xs tabular-nums text-muted-foreground">{row.asset.asset_tag}</p>
              </div>
              <StatusBadge kind="allocation" value={row.is_overdue ? "overdue" : row.status} label={row.is_overdue ? `${row.days_overdue ?? 0}d overdue` : undefined} />
            </div>
            <UserChip user={row.holder} secondary={row.holder.department_name} />
            <p className="text-xs text-muted-foreground">
              Allocated {fmtDateTime(row.allocated_at)} · Due {fmtDate(row.expected_return_date, "not set")}
            </p>
            {row.return_requested ? <StatusBadge kind="allocation" value="return_requested" /> : null}
            <AllocationActions
              row={row}
              onRequestReturn={onRequestReturn}
              onCheckIn={onCheckIn}
              onTransfer={onTransfer}
              pending={pending}
              canManage={canManage}
            />
          </CardContent>
        </Card>
      )}
    />
  );
}
