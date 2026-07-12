import {
  ArrowLeftRight,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  ScrollText,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, ROLES } from "@/lib/constants";

const ICONS = {
  activity: ScrollText,
  allocations: ArrowLeftRight,
  assets: Package,
  audits: ClipboardCheck,
  bookings: CalendarDays,
  dashboard: LayoutDashboard,
  maintenance: Wrench,
  organization: Building2,
  reports: BarChart3,
};

function canViewItem(item, user) {
  if (!item.roles?.length) {
    return true;
  }

  return (
    item.roles.includes(user?.role) ||
    Boolean(item.capability && user?.capabilities?.includes(item.capability))
  );
}

export function Sidebar({ user, onNavigate, className }) {
  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground",
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <span className="grid size-9 place-items-center rounded-lg bg-sidebar-primary text-xs font-semibold tracking-wide text-sidebar-primary-foreground">
          AF
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight">AssetFlow</p>
          <p className="truncate text-xs text-muted-foreground">Operations ledger</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Primary navigation">
        <div className="space-y-6">
          {NAV_ITEMS.map((group) => {
            const visibleItems = group.items.filter((item) => canViewItem(item, user));

            if (visibleItems.length === 0) {
              return null;
            }

            return (
              <div key={group.group} className="space-y-1.5">
                <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {group.group}
                </p>
                <ul className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = ICONS[item.icon];

                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === "/"}
                          onClick={onNavigate}
                          className={({ isActive }) =>
                            cn(
                              "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring lg:min-h-10",
                              isActive &&
                                "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
                            )
                          }
                        >
                          <Icon className="size-4 shrink-0" aria-hidden="true" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg border border-sidebar-border bg-card/55 px-3 py-3">
          <p className="truncate text-xs font-medium text-foreground">
            {user?.organization_name ?? "AssetFlow workspace"}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {ROLES[user?.role] ?? "Employee"}
            {user?.department_name ? ` · ${user.department_name}` : ""}
          </p>
        </div>
      </div>
    </aside>
  );
}
