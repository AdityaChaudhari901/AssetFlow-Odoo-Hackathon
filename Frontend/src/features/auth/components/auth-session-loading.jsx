import { LoaderCircle } from "lucide-react";

import { AuthPanel } from "@/features/auth/components/auth-panel";
import { AuthShell } from "@/features/auth/components/auth-shell";

export function AuthSessionLoading() {
  return (
    <AuthShell>
      <AuthPanel
        eyebrow="Secure access"
        title="Preparing your workspace"
        description="AssetFlow is checking for an existing secure session."
      >
        <div
          className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Verifying session…
        </div>
      </AuthPanel>
    </AuthShell>
  );
}
