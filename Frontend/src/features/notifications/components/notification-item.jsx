import { AlertTriangle, ArrowLeftRight, Clock, Package, Search, Wrench } from "lucide-react";

import { RelativeTime } from "@/components/shared/relative-time";
import { NOTIFICATION_TYPE_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = { alert: AlertTriangle, clock: Clock, package: Package, search: Search, transfer: ArrowLeftRight, wrench: Wrench };

export function NotificationItem({ notification, onActivate, compact = false }) {
  const meta = NOTIFICATION_TYPE_META[notification.type] ?? { label: "Update", icon: "package" };
  const Icon = ICONS[meta.icon] ?? Package;
  return (
    <button type="button" className={cn("flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", !notification.is_read && "bg-accent/45", compact ? "min-h-16" : "min-h-20")} onClick={() => onActivate(notification)}>
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary"><Icon className="size-4" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-foreground">{notification.title}</span>{!notification.is_read ? <><span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" /><span className="sr-only">Unread</span></> : null}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{notification.message}</span><RelativeTime value={notification.created_at} className="mt-1 block text-xs text-muted-foreground" /></span>
    </button>
  );
}
