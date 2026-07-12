import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from "@/hooks/queries/use-notifications";
import { ENTITY_ROUTE_MAP } from "@/lib/constants";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const unreadQuery = useUnreadCount();
  const listQuery = useNotifications(
    { page: 1, limit: 10 },
    { refetchInterval: 60_000, refetchIntervalInBackground: false },
  );
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const count = Number(unreadQuery.data?.data?.count ?? 0);
  const rows = listQuery.data?.data ?? [];

  function activate(notification) {
    if (!notification.is_read) markRead.mutate(notification.id);
    const routeFactory = ENTITY_ROUTE_MAP[notification.entity_type];
    const route =
      routeFactory && notification.entity_id
        ? routeFactory(notification.entity_id)
        : "/notifications";
    setOpen(false);
    navigate(route);
  }

  async function markEverythingRead() {
    try { await markAll.mutateAsync(); } catch (error) { toast.error(error.message); }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) void listQuery.refetch();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-11 sm:size-9" aria-label={count ? `Open notifications, ${count} unread` : "Open notifications"}>
          <Bell aria-hidden="true" />
          {count ? <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-primary px-1 text-center text-[0.65rem] font-semibold leading-4 text-primary-foreground" aria-hidden="true">{count > 99 ? "99+" : count}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><div><p className="font-semibold">Notifications</p><p className="text-xs text-muted-foreground">{count} unread</p></div><Button variant="ghost" className="h-9" disabled={!count || markAll.isPending} onClick={markEverythingRead}>Mark all read</Button></div>
        <div className="max-h-96 overflow-y-auto p-2">{listQuery.isLoading ? <p className="px-3 py-8 text-center text-sm text-muted-foreground" role="status">Loading notifications…</p> : null}{listQuery.error ? <p className="px-3 py-8 text-center text-sm text-destructive">Notifications could not be loaded.</p> : null}{!listQuery.isLoading && !listQuery.error && rows.length ? rows.map((item) => <NotificationItem key={item.id} notification={item} onActivate={activate} compact />) : null}{!listQuery.isLoading && !listQuery.error && !rows.length ? <p className="px-3 py-8 text-center text-sm text-muted-foreground">No notifications yet.</p> : null}</div>
        <div className="border-t border-border p-2"><Button variant="ghost" className="h-10 w-full" onClick={() => { setOpen(false); navigate("/notifications"); }}>View all notifications</Button></div>
      </PopoverContent>
    </Popover>
  );
}
