import { FileQuestion } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <section className="grid min-h-[70vh] place-items-center px-4 py-12 sm:px-6">
      <section className="max-w-lg space-y-6 text-center" aria-labelledby="not-found-title">
        <span className="mx-auto grid size-14 place-items-center rounded-xl border border-border bg-card text-primary">
          <FileQuestion className="size-7" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            404 · Record not found
          </p>
          <h1 id="not-found-title" className="text-3xl font-semibold tracking-tight">
            This AssetFlow route does not exist
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            The link may be outdated, or the record may have moved to another workflow.
          </p>
        </div>
        <Button asChild>
          <Link to="/">Return to dashboard</Link>
        </Button>
      </section>
    </section>
  );
}
