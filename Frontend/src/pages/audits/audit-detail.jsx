import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RouteLoading } from "@/components/shared/route-loading";
import { StatusBadge } from "@/components/shared/status-badge";
import { AuditDiscrepancyTable } from "@/features/audits/components/audit-discrepancy-table";
import { AuditProgress } from "@/features/audits/components/audit-progress";
import { AuditRecordList } from "@/features/audits/components/audit-record-list";
import { useAudit, useAuditDiscrepancies, useCloseAudit, useUpdateAuditRecord } from "@/hooks/queries/use-audits";
import { useAuth } from "@/hooks/use-auth";
import { MANAGER_ROLES } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

export function AuditDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("records");
  const [closeOpen, setCloseOpen] = useState(false);
  const auditQuery = useAudit(id);
  const discrepancyQuery = useAuditDiscrepancies(id, tab === "discrepancies");
  const recordMutation = useUpdateAuditRecord(id);
  const closeMutation = useCloseAudit(id);
  const audit = auditQuery.data?.data;

  if (auditQuery.isLoading) return <RouteLoading label="Loading audit evidence" />;
  if (auditQuery.error) return <QueryErrorState error={auditQuery.error} onRetry={auditQuery.refetch} />;
  if (!audit) return <EmptyState title="Audit cycle unavailable" description="The cycle may have been removed or is outside your access scope." />;

  const assigned = audit.is_assigned_auditor || audit.auditors?.some((item) => item.id === user?.id);
  const editable = audit.status === "open" && assigned;
  const pendingCount = Number(audit.progress?.pending ?? 0);
  const canManageClosure = audit.status === "open" && MANAGER_ROLES.includes(user?.role);
  const canClose = canManageClosure && pendingCount === 0;
  const discrepancyCount = (audit.progress?.missing ?? 0) + (audit.progress?.damaged ?? 0);

  async function confirmClose() {
    try {
      const response = await closeMutation.mutateAsync();
      const summary = response.data?.summary ?? response.data;
      const discrepancies =
        Number(summary?.missing ?? 0) + Number(summary?.damaged ?? 0);
      toast.success(
        `Audit cycle closed with ${discrepancies} ${discrepancies === 1 ? "discrepancy" : "discrepancies"}. Its evidence is now immutable.`,
      );
      setCloseOpen(false);
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-7">
      <PageHeader
        eyebrow="Audit evidence"
        title={audit.name}
        description={`${audit.scope_label ?? "Organization-wide"} · ${fmtDate(audit.start_date)} – ${fmtDate(audit.end_date)}`}
        actions={<div className="flex items-center gap-2"><StatusBadge kind="auditCycle" value={audit.status} />{canClose ? <Button variant="destructive" className="h-11" onClick={() => setCloseOpen(true)}><LockKeyhole aria-hidden="true" />Close cycle</Button> : null}</div>}
      />

      {audit.status === "closed" ? (
        <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/25 p-4 text-sm">
          <LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p><span className="font-medium">Immutable evidence:</span> this cycle is closed and can no longer be edited.</p>
        </div>
      ) : null}

      {canManageClosure && pendingCount > 0 ? (
        <div className="rounded-xl border border-asset-maintenance-border bg-asset-maintenance-surface p-4 text-sm text-asset-maintenance">
          Verify all {pendingCount} pending {pendingCount === 1 ? "asset" : "assets"} before closing and locking this cycle.
        </div>
      ) : null}

      <section className="rounded-xl border border-border/80 bg-card p-5" aria-labelledby="audit-progress-title">
        <h2 id="audit-progress-title" className="mb-4 text-lg font-semibold">Cycle progress</h2>
        <AuditProgress progress={audit.progress} />
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList variant="line" className="h-11 max-w-full overflow-x-auto">
          <TabsTrigger value="records" className="min-h-10 px-3">Asset records</TabsTrigger>
          <TabsTrigger value="discrepancies" className="min-h-10 px-3">Discrepancies ({discrepancyCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="records" className="mt-5">
          {audit.records?.length ? <AuditRecordList records={audit.records} editable={editable} mutation={recordMutation} /> : <EmptyState title="No assets in this cycle" description="The audit snapshot contains no asset records." />}
        </TabsContent>
        <TabsContent value="discrepancies" className="mt-5"><AuditDiscrepancyTable query={discrepancyQuery} /></TabsContent>
      </Tabs>

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close this audit cycle?"
        description={`This locks all evidence and marks ${audit.progress?.missing ?? 0} missing assets as Lost. This action cannot be undone.`}
        confirmLabel="Close and lock cycle"
        destructive
        pending={closeMutation.isPending}
        onConfirm={confirmClose}
      />
    </div>
  );
}
