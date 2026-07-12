import { CircleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function QueryErrorState({
  error,
  title = "We could not load this workspace",
  onRetry,
  compact = false,
}) {
  return (
    <div
      className={`rounded-xl border border-destructive/25 bg-destructive/5 p-5 ${compact ? "" : "min-h-48"}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            {error?.message ?? "The request could not be completed. Please try again."}
          </p>
          {error?.requestId ? (
            <p className="text-xs tabular-nums text-muted-foreground">
              Request ID: {error.requestId}
            </p>
          ) : null}
          {onRetry ? (
            <Button type="button" variant="outline" className="mt-2 h-10" onClick={onRetry}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
