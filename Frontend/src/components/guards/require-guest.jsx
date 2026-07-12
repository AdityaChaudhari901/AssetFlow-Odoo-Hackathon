import { Navigate, Outlet, useLocation } from "react-router";

import { getSafeReturnPath } from "@/features/auth/auth-navigation";
import { AuthSessionLoading } from "@/features/auth/components/auth-session-loading";
import { useAuth } from "@/hooks/use-auth";

export function RequireGuest() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthSessionLoading />;
  }

  if (user) {
    return <Navigate to={getSafeReturnPath(location.state?.from)} replace />;
  }

  return <Outlet />;
}
