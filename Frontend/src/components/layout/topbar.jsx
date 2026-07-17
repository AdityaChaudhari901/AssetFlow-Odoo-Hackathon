import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, ChevronDown, LogOut, Menu, Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, matchPath, useLocation, useNavigate } from "react-router";
import { z } from "zod";

import { Sidebar } from "@/components/layout/sidebar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { NotificationBell } from "@/features/notifications/components/notification-bell";

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

function getRouteMeta(pathname) {
  return (
    ROUTE_META.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname)) ??
    { title: "AssetFlow", section: "Workspace" }
  );
}

const globalSearchSchema = z.object({
  query: z.string().trim().min(1).max(120),
});

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const routeMeta = getRouteMeta(location.pathname);
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(globalSearchSchema),
    defaultValues: { query: "" },
  });

  function searchAssets(values) {
    navigate(`/assets?search=${encodeURIComponent(values.query.trim())}`);
    reset();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b border-border/80 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Sheet open={mobileNavigationOpen} onOpenChange={setMobileNavigationOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-11 md:hidden"
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
                mobile
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

        <form
          className="relative ml-auto hidden w-full max-w-sm md:block"
          role="search"
          onSubmit={handleSubmit(searchAssets)}
          noValidate
        >
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search asset tag, name, or serial"
            aria-label="Search assets"
            className="h-9 bg-muted/25 pl-9"
            {...register("query")}
          />
        </form>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />

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
