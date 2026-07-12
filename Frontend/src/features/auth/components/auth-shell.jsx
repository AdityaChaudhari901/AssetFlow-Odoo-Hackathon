import { ArrowRight, CircleDotDashed, ShieldCheck } from "lucide-react";

const CUSTODY_STEPS = [
  { label: "Register", detail: "Create the asset passport" },
  { label: "Allocate", detail: "Record accountable custody" },
  { label: "Audit", detail: "Verify the complete trail" },
];

function AssetFlowMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        AF
      </span>
      <span>
        <span className="block text-lg font-semibold tracking-tight">AssetFlow</span>
        <span className="block text-xs text-muted-foreground">
          Asset &amp; resource operations
        </span>
      </span>
    </div>
  );
}

export function AuthShell({ children }) {
  return (
    <main className="relative min-h-screen min-h-dvh overflow-x-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary"
        aria-hidden="true"
      />

      <div className="mx-auto grid min-h-screen min-h-dvh w-full max-w-7xl lg:grid-cols-[minmax(0,0.88fr)_minmax(28rem,1.12fr)]">
        <section
          className="hidden border-r border-border/80 px-10 py-12 lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-16"
          aria-labelledby="custody-context-title"
        >
          <AssetFlowMark />

          <div className="my-16 max-w-lg space-y-9">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Controlled access
              </p>
              <h2
                id="custody-context-title"
                className="max-w-md text-4xl font-semibold leading-tight tracking-[-0.035em]"
              >
                Every asset has a passport. Every action leaves a trail.
              </h2>
              <p className="max-w-md text-base leading-7 text-muted-foreground">
                Sign in to manage custody, bookings, maintenance, and audit
                evidence from one accountable workspace.
              </p>
            </div>

            <ol className="border-y border-border/80" aria-label="Asset custody lifecycle">
              {CUSTODY_STEPS.map((step, index) => (
                <li
                  key={step.label}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 py-4 last:border-b-0"
                >
                  <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{step.label}</span>
                    <span className="block text-sm text-muted-foreground">
                      {step.detail}
                    </span>
                  </span>
                  {index < CUSTODY_STEPS.length - 1 ? (
                    <ArrowRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <CircleDotDashed
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex items-center gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            <span>Identity is verified before operational data is loaded.</span>
          </div>
        </section>

        <section className="flex min-h-screen min-h-dvh items-start justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center lg:px-12 xl:px-16">
          <div className="w-full max-w-md space-y-6">
            <div className="lg:hidden">
              <AssetFlowMark />
            </div>

            {children}

            <p className="flex items-center justify-center gap-2 text-center text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
              Secure access managed by AssetFlow and your organization.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
