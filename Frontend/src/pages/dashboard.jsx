import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { ActivityList } from "@/features/activity/components/activity-list";
import { KpiLedger } from "@/features/dashboard/components/kpi-ledger";
import { MyWork } from "@/features/dashboard/components/my-work";
import { QuickActions } from "@/features/dashboard/components/quick-actions";
import { ReturnQueue } from "@/features/dashboard/components/return-queue";
import { useActivityLogs } from "@/hooks/queries/use-activity-logs";
import { useDashboardKpis, useDashboardReturns } from "@/hooks/queries/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { APP_ROLES } from "@/lib/constants";

export function DashboardPage() {
  const { user } = useAuth();
  const kpis = useDashboardKpis();
  const overdue = useDashboardReturns("overdue");
  const upcoming = useDashboardReturns("upcoming");
  const activity = useActivityLogs({ page: 1, limit: 5 }, user?.role === APP_ROLES.ADMIN);

  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-7">
      <PageHeader eyebrow="Today’s operations" title="Dashboard" description="Availability, custody, bookings, maintenance, and exceptions in one accountable view." />
      {kpis.error ? <QueryErrorState error={kpis.error} onRetry={kpis.refetch} /> : <KpiLedger data={kpis.data?.data} loading={kpis.isLoading} />}
      <QuickActions user={user} />
      {user?.role === APP_ROLES.EMPLOYEE ? <MyWork /> : null}
      <div className="grid gap-4 xl:grid-cols-2"><ReturnQueue title="Overdue returns" type="overdue" query={overdue} /><ReturnQueue title="Due in the next 7 days" type="upcoming" query={upcoming} /></div>
      {user?.role === APP_ROLES.ADMIN ? <section className="rounded-xl border border-border/80 bg-card p-5" aria-labelledby="recent-activity-title">
        <div className="mb-4"><h2 id="recent-activity-title" className="font-semibold">Recent activity</h2><p className="mt-1 text-sm text-muted-foreground">Latest attributable workflow events.</p></div>
        {activity.isLoading ? <p className="text-sm text-muted-foreground" role="status">Loading recent activity…</p> : null}
        {activity.error ? <QueryErrorState error={activity.error} onRetry={activity.refetch} compact /> : null}
        {!activity.isLoading && !activity.error ? <ActivityList rows={activity.data?.data ?? []} compact /> : null}
      </section> : null}
    </div>
  );
}
