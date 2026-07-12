import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function KpiCard({ label, value, icon: Icon, to, emphasis = "default", loading = false }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("grid size-8 place-items-center rounded-lg border border-border bg-background", emphasis === "danger" ? "text-destructive" : "text-primary")}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        {to ? <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" /> : null}
      </div>
      <div className="mt-5">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", emphasis === "danger" && "text-destructive")}>
            {value}
          </p>
        )}
        <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
      </div>
    </>
  );

  const className = cn(
    "block min-h-32 border-r border-b border-border/70 p-4 transition-colors last:border-r-0",
    to && "hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    emphasis === "danger" && "bg-destructive/5",
  );

  return to ? (
    <Link to={to} className={className} aria-label={`${label}: ${value}`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
