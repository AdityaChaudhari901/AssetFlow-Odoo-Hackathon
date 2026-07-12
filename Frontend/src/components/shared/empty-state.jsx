import { Inbox } from "lucide-react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-5 text-center",
        compact ? "min-h-36 py-6" : "min-h-64 py-10",
        className,
      )}
    >
      <span className="mb-4 grid size-10 place-items-center rounded-lg border border-border bg-background text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
