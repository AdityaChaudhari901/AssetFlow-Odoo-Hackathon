import { Check, Circle, X } from "lucide-react";

import { MAINTENANCE_FLOW } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MaintenanceStepper({ status }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-destructive">
        <span className="grid size-8 place-items-center rounded-full bg-destructive/10"><X className="size-4" aria-hidden="true" /></span>
        <div><p className="text-sm font-semibold">Request rejected</p><p className="text-xs opacity-80">This workflow is closed.</p></div>
      </div>
    );
  }

  const activeIndex = MAINTENANCE_FLOW.indexOf(status);
  return (
    <ol className="grid gap-2" aria-label="Maintenance workflow progress">
      {MAINTENANCE_FLOW.map((step, index) => {
        const complete = index < activeIndex || status === "resolved";
        const active = index === activeIndex && status !== "resolved";
        return (
          <li key={step} className="flex items-center gap-3">
            <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border", complete && "border-success bg-success-surface text-success", active && "border-primary bg-primary text-primary-foreground", !complete && !active && "border-border text-muted-foreground")}>
              {complete ? <Check className="size-3.5" aria-hidden="true" /> : <Circle className={cn("size-2.5", active && "fill-current")} aria-hidden="true" />}
            </span>
            <span className={cn("text-sm", active || complete ? "font-medium text-foreground" : "text-muted-foreground")}>{titleCase(step)}</span>
            {active ? <span className="ml-auto text-xs font-medium text-primary">Current</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
