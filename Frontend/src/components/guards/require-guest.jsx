import { Navigate, Outlet } from "react-router";

import { RouteLoading } from "@/components/shared/route-loading";
import { useAuth } from "@/hooks/use-auth";

export function RequireGuest() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-12 sm:px-6">
        <RouteLoading label="Checking your AssetFlow session" />
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
