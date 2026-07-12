import { cn } from "@/lib/utils";

const SEGMENTS = [
  { key: "verified", label: "Verified" },
  { key: "missing", label: "Missing" },
  { key: "damaged", label: "Damaged" },
];

export function AuditProgress({ progress = {}, compact = false }) {
  const total = Number(progress.total) || 0;
  const completed = Math.max(0, total - (Number(progress.pending) || 0));
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="font-medium text-foreground">Verification progress</span>
        <span className="tabular-nums text-muted-foreground">{completed} of {total}</span>
      </div>
      <progress
        className="h-2 w-full overflow-hidden rounded-full accent-primary"
        value={completed}
        max={total || 1}
        aria-label={`${completed} of ${total} assets verified`}
      />
      {!compact ? (
        <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {[...SEGMENTS, { key: "pending", label: "Pending", className: "" }].map((item) => (
            <div key={item.key} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 text-base font-semibold tabular-nums text-foreground">{Number(progress[item.key]) || 0}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
