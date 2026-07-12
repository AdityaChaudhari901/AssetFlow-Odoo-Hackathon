import { useState } from "react";
import { ClipboardCheck, Plus } from "lucide-react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RouteLoading } from "@/components/shared/route-loading";
import { AuditCycleCard } from "@/features/audits/components/audit-cycle-card";
import { CreateAuditDialog } from "@/features/audits/components/create-audit-dialog";
import { useAudits } from "@/hooks/queries/use-audits";
import { useAuth } from "@/hooks/use-auth";
import { APP_ROLES } from "@/lib/constants";

export function AuditListPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [createOpen, setCreateOpen] = useState(false);
  const status = params.get("status") || "all";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const queryParams = { page, limit: 12, ...(status !== "all" ? { status } : {}) };
  const query = useAudits(queryParams);
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.limit ?? 12)));

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (!value || value === "all" || value === "1") next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setParams(next, { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <PageHeader
        eyebrow="Verification cycles"
        title="Asset audits"
        description="Snapshot scoped assets, record physical evidence, and retain an immutable discrepancy trail."
        actions={user?.role === APP_ROLES.ADMIN ? (
          <Button className="h-11" onClick={() => setCreateOpen(true)}><Plus aria-hidden="true" />New audit cycle</Button>
        ) : null}
      />

      <div className="flex items-center justify-between gap-3">
        <Select value={status} onValueChange={(value) => updateParam("status", value)}>
          <SelectTrigger className="h-11 w-full sm:w-52" aria-label="Filter audits by status"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All cycles</SelectItem><SelectItem value="open">Open</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
        </Select>
        {meta ? <p className="hidden text-xs tabular-nums text-muted-foreground sm:block">{meta.total} cycles</p> : null}
      </div>

      {query.isLoading ? <RouteLoading label="Loading audit cycles" /> : null}
      {query.error ? <QueryErrorState error={query.error} onRetry={query.refetch} /> : null}
      {!query.isLoading && !query.error && rows.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="No audit cycles found" description="Change the status filter or create the first controlled verification cycle." />
      ) : null}
      {rows.length ? <div className="grid gap-4 lg:grid-cols-2">{rows.map((audit) => <AuditCycleCard key={audit.id} audit={audit} />)}</div> : null}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-5">
          <p className="text-xs tabular-nums text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" className="h-10" disabled={page <= 1 || query.isFetching} onClick={() => updateParam("page", String(page - 1))}>Previous</Button>
            <Button variant="outline" className="h-10" disabled={page >= totalPages || query.isFetching} onClick={() => updateParam("page", String(page + 1))}>Next</Button>
          </div>
        </div>
      ) : null}

      <CreateAuditDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
