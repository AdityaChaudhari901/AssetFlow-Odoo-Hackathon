import { useState } from "react";
import { Bell, ChevronDown, LogOut, Menu } from "lucide-react";
import { Link, matchPath, useLocation } from "react-router";

import { Sidebar } from "@/components/layout/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { ROLES, ROUTE_META } from "@/lib/constants";

function getInitials(name = "") {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "AF";
}

function getRouteMeta(pathname) {
  return (
    ROUTE_META.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname)) ??
    { title: "AssetFlow", section: "Workspace" }
  );
}

export function Topbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const routeMeta = getRouteMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 lg:hidden"
                aria-label="Open navigation"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(20rem,88vw)] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>AssetFlow navigation</SheetTitle>
                <SheetDescription>
                  Navigate between AssetFlow operational areas.
                </SheetDescription>
              </SheetHeader>
              <Sidebar
                user={user}
                onNavigate={() => setMobileNavigationOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">
              {routeMeta.section}
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {routeMeta.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative size-11 sm:size-9"
          >
            <Link to="/notifications" aria-label="Open notifications">
              <Bell aria-hidden="true" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-11 gap-2 px-2 sm:h-9"
                aria-label="Open user menu"
              >
                <Avatar className="size-7">
                  <AvatarImage src={user?.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-[0.68rem] font-semibold">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden max-w-36 truncate text-sm sm:block">
                  {user?.full_name ?? "AssetFlow user"}
                </span>
                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="space-y-1">
                <p className="truncate font-medium">{user?.full_name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs font-normal text-primary">
                  {ROLES[user?.role] ?? "Employee"}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/notifications">
                  <Bell aria-hidden="true" />
                  Notifications
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => void logout()}
              >
                <LogOut aria-hidden="true" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
