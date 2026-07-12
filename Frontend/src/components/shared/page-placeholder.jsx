import { ArrowRight, CheckCircle2, CircleDotDashed, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FOUNDATION_ITEMS = [
  { icon: ShieldCheck, label: "Role boundary prepared" },
  { icon: CircleDotDashed, label: "Loading and error states reserved" },
  { icon: CheckCircle2, label: "API contract isolated" },
];

export function PagePlaceholder({ eyebrow, title, description, nextStep }) {
  return (
    <section className="mx-auto w-full max-w-7xl space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="text-base leading-7 text-muted-foreground">{description}</p>
      </header>

      <Card className="max-w-4xl border border-border/80 ring-0">
        <CardHeader className="border-b border-border/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>Workflow foundation</CardTitle>
              <CardDescription>
                Navigation, permissions, and data states are prepared for this workflow.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-primary/25 bg-accent text-accent-foreground">
              Planned
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 py-4 sm:grid-cols-3">
          {FOUNDATION_ITEMS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex min-h-20 items-start gap-3 rounded-lg border border-border/70 bg-muted/35 p-3"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-background text-primary ring-1 ring-border">
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="text-sm leading-5 text-foreground">{label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex max-w-4xl items-start gap-3 border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground">
        <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p>
          <span className="font-medium text-foreground">Planned workflow:</span>{" "}
          {nextStep}
        </p>
      </div>
    </section>
  );
}
