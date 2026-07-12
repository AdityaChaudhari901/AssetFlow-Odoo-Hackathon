import { Navigate, Outlet, useLocation } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RouteLoading } from "@/components/shared/route-loading";
import { useAuth } from "@/hooks/use-auth";

export function RequireAuth() {
  const location = useLocation();
  const { user, loading, authError, retryAuthentication } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6">
        <RouteLoading label="Checking your AssetFlow session" />
      </main>
    );
  }

  if (authError && !user) {
    return (
      <main className="grid min-h-screen place-items-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-lg border border-border ring-0" role="alert">
          <CardHeader>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive">
              Connection problem
            </p>
            <h1 className="text-xl font-semibold tracking-tight">
              We could not verify your session
            </h1>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">
              {authError.message} Your work has not been changed.
            </p>
            {authError.requestId ? (
              <p className="text-xs tabular-nums text-muted-foreground">
                Request ID: {authError.requestId}
              </p>
            ) : null}
            <Button onClick={() => void retryAuthentication()}>Try again</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
