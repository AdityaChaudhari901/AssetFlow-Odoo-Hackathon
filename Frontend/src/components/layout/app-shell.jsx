import { useEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { matchPath, Outlet, useLocation } from "react-router";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { useAuth } from "@/hooks/use-auth";
import { ROUTE_META } from "@/lib/constants";

function useNetworkStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const mainRef = useRef(null);
  const online = useNetworkStatus();

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    const route = ROUTE_META.find(({ pattern }) =>
      matchPath({ path: pattern, end: true }, location.pathname),
    );
    document.title = route ? `${route.title} · AssetFlow` : "AssetFlow";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <div className="flex min-h-screen">
        <Sidebar
          user={user}
          className="fixed inset-y-0 left-0 border-r border-sidebar-border"
        />

        <div className="flex min-w-0 flex-1 flex-col md:pl-[60px]">
          <Topbar />

          {!online ? (
            <div
              className="flex items-center justify-center gap-2 border-b border-asset-maintenance-border bg-asset-maintenance-surface px-4 py-2 text-sm text-asset-maintenance"
              role="status"
            >
              <WifiOff className="size-4" aria-hidden="true" />
              You are offline. Displayed data may be out of date.
            </div>
          ) : null}

          <main
            id="main-content"
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
