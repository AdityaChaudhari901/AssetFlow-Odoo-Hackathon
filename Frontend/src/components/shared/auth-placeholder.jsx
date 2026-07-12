import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

export function AuthPlaceholder({ title, description, alternateAction }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary"
        aria-hidden="true"
      />
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3" aria-label="AssetFlow">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
            AF
          </span>
          <span className="text-lg font-semibold tracking-tight">AssetFlow</span>
        </div>

        <Card className="border border-border/80 ring-0">
          <CardHeader className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Secure access
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <CardDescription className="leading-6">{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-border bg-muted/35 px-4 py-6 text-center text-sm text-muted-foreground">
              The secure access form is being connected to the AssetFlow identity service.
            </div>
            {alternateAction ? (
              <Button asChild variant="outline" className="w-full">
                <Link to={alternateAction.to}>{alternateAction.label}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
