import { useState } from "react";
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
import { motion } from "motion/react";
import { NavLink } from "react-router";

import { OdooBrand, OdooLogo } from "@/components/shared/odoo-brand";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DesktopSidebar,
  Sidebar as AceternitySidebar,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV_ITEMS, ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";

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

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "U";
}

function SidebarBrand({ expanded, onNavigate }) {
  return (
    <NavLink
      to="/"
      onClick={onNavigate}
      className={cn(
        "flex h-16 shrink-0 items-center border-b border-sidebar-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sidebar-ring",
        expanded ? "gap-3 px-5" : "justify-center px-3",
      )}
      aria-label={expanded ? undefined : "AssetFlow dashboard"}
    >
      <OdooLogo
        className={cn("shrink-0", expanded ? "h-4.5" : "h-3.5 max-w-9")}
        alt=""
      />
      <motion.span
        initial={false}
        animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
        className="min-w-0 overflow-hidden whitespace-nowrap"
        aria-hidden={!expanded}
      >
        <span className="block truncate text-sm font-semibold tracking-tight">
          AssetFlow
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          Operations ledger
        </span>
      </motion.span>
    </NavLink>
  );
}

function SidebarNavigation({ user, expanded, onNavigate }) {
  return (
    <nav
      className="flex-1 overflow-x-hidden overflow-y-auto px-2 py-5"
      aria-label="Primary navigation"
    >
      <div className="space-y-6">
        {NAV_ITEMS.map((group) => {
          const visibleItems = group.items.filter((item) => canViewItem(item, user));

          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div key={group.group} className="space-y-1.5">
              <motion.p
                initial={false}
                animate={{ opacity: expanded ? 1 : 0, height: expanded ? "auto" : 0 }}
                className="overflow-hidden whitespace-nowrap px-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                aria-hidden={!expanded}
              >
                {group.group}
              </motion.p>
              <ul className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = ICONS[item.icon];

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === "/"}
                        onClick={onNavigate}
                        title={expanded ? undefined : item.label}
                        aria-label={expanded ? undefined : item.label}
                        className={({ isActive }) =>
                          cn(
                            "group relative flex min-h-11 items-center rounded-lg text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                            expanded ? "gap-3 px-3" : "justify-center px-2",
                            isActive &&
                              "bg-sidebar-accent font-medium text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-sidebar-primary",
                          )
                        }
                      >
                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                        <motion.span
                          initial={false}
                          animate={{
                            opacity: expanded ? 1 : 0,
                            width: expanded ? "auto" : 0,
                          }}
                          className="overflow-hidden whitespace-nowrap"
                          aria-hidden={!expanded}
                        >
                          {item.label}
                        </motion.span>
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
  );
}

function SidebarAccount({ user, expanded }) {
  return (
    <div className="border-t border-sidebar-border p-2">
      {expanded ? <OdooBrand className="mb-3 justify-center" /> : null}
      <div
        className={cn(
          "flex min-h-12 items-center rounded-lg border border-sidebar-border bg-card/55",
          expanded ? "gap-3 px-3 py-2" : "justify-center p-2",
        )}
      >
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={user?.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="text-[0.68rem] font-semibold">
            {getInitials(user?.full_name)}
          </AvatarFallback>
        </Avatar>
        <motion.div
          initial={false}
          animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
          className="min-w-0 flex-1 overflow-hidden whitespace-nowrap"
          aria-hidden={!expanded}
        >
          <p className="truncate text-xs font-medium text-foreground">
            {user?.organization_name ?? "AssetFlow workspace"}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {ROLES[user?.role] ?? "Employee"}
            {user?.department_name ? ` · ${user.department_name}` : ""}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SidebarContent({ user, expanded, onNavigate }) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col bg-sidebar text-sidebar-foreground">
      <SidebarBrand expanded={expanded} onNavigate={onNavigate} />
      <SidebarNavigation user={user} expanded={expanded} onNavigate={onNavigate} />
      <SidebarAccount user={user} expanded={expanded} />
    </aside>
  );
}

function ExpandableSidebarContent({ user }) {
  const { open } = useSidebar();

  return <SidebarContent user={user} expanded={open} />;
}

export function Sidebar({ user, onNavigate, mobile = false, className }) {
  const [open, setOpen] = useState(false);

  if (mobile) {
    return <SidebarContent user={user} expanded onNavigate={onNavigate} />;
  }

  return (
    <AceternitySidebar open={open} setOpen={setOpen}>
      <DesktopSidebar
        className={cn(
          "z-40 !bg-sidebar !p-0 text-sidebar-foreground",
          className,
        )}
        onMouseLeave={(event) => {
          if (!event.currentTarget.contains(document.activeElement)) {
            setOpen(false);
          }
        }}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setOpen(false);
          }
        }}
      >
        <ExpandableSidebarContent user={user} />
      </DesktopSidebar>
    </AceternitySidebar>
  );
}
