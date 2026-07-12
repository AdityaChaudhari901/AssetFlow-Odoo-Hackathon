import { Bell, CheckCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RouteLoading } from "@/components/shared/route-loading";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount } from "@/hooks/queries/use-notifications";
import { ENTITY_ROUTE_MAP } from "@/lib/constants";
import { fmtDate } from "@/lib/format";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = useNotifications({ page, limit: 20 });
  const unread = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.limit ?? 20)));
  const groups = rows.reduce((result, item) => {
    const label = fmtDate(item.created_at);
    (result[label] ??= []).push(item);
    return result;
  }, {});

  function activate(notification) {
    if (!notification.is_read) markRead.mutate(notification.id);
    const routeFactory = ENTITY_ROUTE_MAP[notification.entity_type];
    navigate(
      routeFactory && notification.entity_id
        ? routeFactory(notification.entity_id)
        : "/notifications",
    );
  }

  async function markEverythingRead() {
    try { await markAll.mutateAsync(); } catch (error) { toast.error(error.message); }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7">
      <PageHeader
        eyebrow="Account inbox"
        title="Notifications"
        description="Assignments, approvals, booking events, overdue returns, and audit exceptions."
        actions={<Button variant="outline" className="h-11" disabled={!unread.data?.data?.count || markAll.isPending} onClick={markEverythingRead}><CheckCheck aria-hidden="true" />Mark all read</Button>}
      />
      {query.isLoading ? <RouteLoading label="Loading notifications" /> : null}
      {query.error ? <QueryErrorState error={query.error} onRetry={query.refetch} /> : null}
      {!query.isLoading && !query.error && !rows.length ? <EmptyState icon={Bell} title="No notifications yet" description="Workflow updates that need your attention will appear here." /> : null}
      <div className="space-y-6">{Object.entries(groups).map(([date, items]) => <section key={date} aria-labelledby={`notification-date-${date.replaceAll(" ", "-")}`}><h2 id={`notification-date-${date.replaceAll(" ", "-")}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{date}</h2><div className="space-y-1 rounded-xl border border-border/80 bg-card p-2">{items.map((item) => <NotificationItem key={item.id} notification={item} onActivate={activate} />)}</div></section>)}</div>
      {totalPages > 1 ? <div className="flex items-center justify-between border-t border-border/70 pt-5"><p className="text-xs tabular-nums text-muted-foreground">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" className="h-10" disabled={page <= 1} onClick={() => setParams(page - 1 > 1 ? { page: String(page - 1) } : {})}>Previous</Button><Button variant="outline" className="h-10" disabled={page >= totalPages} onClick={() => setParams({ page: String(page + 1) })}>Next</Button></div></div> : null}
    </div>
  );
}
