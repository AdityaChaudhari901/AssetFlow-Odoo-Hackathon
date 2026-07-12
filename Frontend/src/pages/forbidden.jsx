import { ShieldX } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ForbiddenPage() {
  return (
    <section className="grid min-h-[60vh] place-items-center" aria-labelledby="forbidden-title">
      <Card className="w-full max-w-xl border border-border ring-0">
        <CardContent className="space-y-5 py-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldX className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
              403 · Restricted
            </p>
            <h1 id="forbidden-title" className="text-2xl font-semibold tracking-tight">
              You do not have access to this area
            </h1>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
              AssetFlow keeps organization and approval workflows limited to authorized roles. Your account has not been changed.
            </p>
          </div>
          <Button asChild>
            <Link to="/">Return to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
