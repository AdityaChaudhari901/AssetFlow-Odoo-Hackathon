import { Navigate, Outlet } from "react-router";

import { useAuth } from "@/hooks/use-auth";

export function RequireRole({ roles = [], capability, children }) {
  const { user, hasCapability } = useAuth();
  const roleAllowed = roles.length === 0 || roles.includes(user?.role);
  const capabilityAllowed = capability ? hasCapability(capability) : false;

  if (!roleAllowed && !capabilityAllowed) {
    return <Navigate to="/forbidden" replace />;
  }

  return children ?? <Outlet />;
}
