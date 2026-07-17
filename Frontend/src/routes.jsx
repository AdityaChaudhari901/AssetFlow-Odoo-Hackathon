import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import { RequireAuth } from "@/components/guards/require-auth";
import { RequireGuest } from "@/components/guards/require-guest";
import { RequireRole } from "@/components/guards/require-role";
import { RouteLoading } from "@/components/shared/route-loading";
import { useAuth } from "@/hooks/use-auth";
import { APP_ROLES, MANAGER_ROLES } from "@/lib/constants";

function lazyNamed(importer, exportName) {
  return lazy(() =>
    importer().then((module) => ({ default: module[exportName] })),
  );
}

function Page({ component: Component }) {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Component />
    </Suspense>
  );
}

function PublicPage({ component: Component }) {
  return (
    <main className="min-h-screen">
      <Page component={Component} />
    </main>
  );
}

function NotFoundBoundary() {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return <PublicPage component={RouteLoading} />;
  }

  if (user) {
    return (
      <Navigate
        to="/not-found"
        replace
        state={{ requestedPath: location.pathname }}
      />
    );
  }

  return <PublicPage component={NotFoundPage} />;
}

const LoginPage = lazyNamed(() => import("@/pages/auth/login"), "LoginPage");
const loadAppShell = () => import("@/components/layout/app-shell");
const AppShell = lazyNamed(loadAppShell, "AppShell");
const SignupPage = lazyNamed(() => import("@/pages/auth/signup"), "SignupPage");
const ForgotPasswordPage = lazyNamed(
  () => import("@/pages/auth/forgot-password"),
  "ForgotPasswordPage",
);
const ResetPasswordPage = lazyNamed(
  () => import("@/pages/auth/reset-password"),
  "ResetPasswordPage",
);
const DashboardPage = lazyNamed(() => import("@/pages/dashboard"), "DashboardPage");
const OrganizationPage = lazyNamed(
  () => import("@/pages/organization/index"),
  "OrganizationPage",
);
const AssetListPage = lazyNamed(
  () => import("@/pages/assets/asset-list"),
  "AssetListPage",
);
const AssetDetailPage = lazyNamed(
  () => import("@/pages/assets/asset-detail"),
  "AssetDetailPage",
);
const AllocationListPage = lazyNamed(
  () => import("@/pages/allocations/allocation-list"),
  "AllocationListPage",
);
const BookingPage = lazyNamed(
  () => import("@/pages/bookings/booking-page"),
  "BookingPage",
);
const MaintenancePage = lazyNamed(
  () => import("@/pages/maintenance/maintenance-list"),
  "MaintenancePage",
);
const AuditListPage = lazyNamed(
  () => import("@/pages/audits/audit-list"),
  "AuditListPage",
);
const AuditDetailPage = lazyNamed(
  () => import("@/pages/audits/audit-detail"),
  "AuditDetailPage",
);
const ReportsPage = lazyNamed(
  () => import("@/pages/reports/reports-page"),
  "ReportsPage",
);
const NotificationsPage = lazyNamed(
  () => import("@/pages/notifications"),
  "NotificationsPage",
);
const ActivityLogsPage = lazyNamed(
  () => import("@/pages/activity-logs"),
  "ActivityLogsPage",
);
const ForbiddenPage = lazyNamed(
  () => import("@/pages/forbidden"),
  "ForbiddenPage",
);
const NotFoundPage = lazyNamed(
  () => import("@/pages/not-found"),
  "NotFoundPage",
);

const PUBLIC_ENTRY_PATHS = new Set([
  "/forgot-password",
  "/login",
  "/reset-password",
  "/signup",
]);

export function AppRoutes() {
  const location = useLocation();

  useEffect(() => {
    if (!PUBLIC_ENTRY_PATHS.has(location.pathname)) {
      void loadAppShell().catch(() => undefined);
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route
        path="/reset-password"
        element={<Page component={ResetPasswordPage} />}
      />

      <Route element={<RequireGuest />}>
        <Route path="/login" element={<Page component={LoginPage} />} />
        <Route path="/signup" element={<Page component={SignupPage} />} />
        <Route
          path="/forgot-password"
          element={<Page component={ForgotPasswordPage} />}
        />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<Page component={AppShell} />}>
          <Route index element={<Page component={DashboardPage} />} />
          <Route path="assets" element={<Page component={AssetListPage} />} />
          <Route path="assets/:id" element={<Page component={AssetDetailPage} />} />
          <Route
            path="allocations"
            element={<Page component={AllocationListPage} />}
          />
          <Route path="bookings" element={<Page component={BookingPage} />} />
          <Route
            path="maintenance"
            element={<Page component={MaintenancePage} />}
          />
          <Route
            path="notifications"
            element={<Page component={NotificationsPage} />}
          />
          <Route path="forbidden" element={<Page component={ForbiddenPage} />} />
          <Route path="not-found" element={<Page component={NotFoundPage} />} />

          <Route element={<RequireRole roles={[APP_ROLES.ADMIN]} />}>
            <Route
              path="organization"
              element={<Page component={OrganizationPage} />}
            />
            <Route path="activity" element={<Page component={ActivityLogsPage} />} />
          </Route>

          <Route
            element={
              <RequireRole
                roles={MANAGER_ROLES}
                capability="audits.view"
              />
            }
          >
            <Route path="audits" element={<Page component={AuditListPage} />} />
            <Route path="audits/:id" element={<Page component={AuditDetailPage} />} />
          </Route>

          <Route
            element={
              <RequireRole
                roles={[
                  APP_ROLES.ADMIN,
                  APP_ROLES.ASSET_MANAGER,
                  APP_ROLES.DEPARTMENT_HEAD,
                ]}
              />
            }
          >
            <Route path="reports" element={<Page component={ReportsPage} />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundBoundary />} />
    </Routes>
  );
}
