import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "react-router";

import { AuditProgress } from "@/features/audits/components/audit-progress";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserChip } from "@/components/shared/user-chip";
import { fmtDate } from "@/lib/format";

export function AuditCycleCard({ audit }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border/80 bg-card">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Inspection record</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{audit.name}</h2>
        </div>
        <StatusBadge kind="auditCycle" value={audit.status} />
      </div>
      <div className="flex-1 space-y-5 p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div><dt className="sr-only">Scope</dt><dd>{audit.scope_label ?? "Organization-wide"}</dd></div>
          </div>
          <div className="flex gap-2">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <div><dt className="sr-only">Date range</dt><dd>{fmtDate(audit.start_date)} – {fmtDate(audit.end_date)}</dd></div>
          </div>
        </dl>
        <AuditProgress progress={audit.progress} compact />
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Assigned auditors</p>
          <div className="space-y-2">
            {audit.auditors?.length ? audit.auditors.slice(0, 2).map((auditor) => (
              <UserChip key={auditor.id} user={auditor} compact />
            )) : <p className="text-sm text-muted-foreground">No auditors assigned</p>}
          </div>
        </div>
      </div>
      <div className="border-t border-border/70 p-4">
        <Link
          to={`/audits/${audit.id}`}
          className="flex h-11 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open audit cycle
        </Link>
      </div>
    </article>
  );
}
