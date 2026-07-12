import { AlertTriangle, ArrowLeftRight, CalendarClock, PackageCheck, PackageOpen, RotateCcw, Wrench } from "lucide-react";

import { KpiCard } from "@/components/shared/kpi-card";

const KPI_ITEMS = [
  { key: "assets_available", label: "Assets available", icon: PackageOpen, to: "/assets?status=available" },
  { key: "assets_allocated", label: "Assets allocated", icon: PackageCheck, to: "/assets?status=allocated" },
  { key: "maintenance_active", label: "Active maintenance", icon: Wrench, to: "/maintenance" },
  { key: "active_bookings_today", label: "Bookings today", icon: CalendarClock, to: "/bookings" },
  { key: "pending_transfers", label: "Pending transfers", icon: ArrowLeftRight, to: "/allocations?tab=transfers" },
  { key: "upcoming_returns", label: "Upcoming returns", icon: RotateCcw, to: "/allocations?tab=active" },
  { key: "overdue_returns", label: "Overdue returns", icon: AlertTriangle, to: "/allocations?tab=overdue", emphasis: "danger" },
];

export function KpiLedger({ data = {}, loading = false }) {
  return (
    <section aria-labelledby="operations-ledger-title">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="operations-ledger-title" className="text-sm font-semibold">Today’s operational ledger</h2>
        <span className="text-xs text-muted-foreground">Live workflow totals</span>
      </div>
      <div className="grid overflow-hidden rounded-xl border border-border/80 bg-card sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {KPI_ITEMS.map((item) => <KpiCard key={item.key} {...item} value={data[item.key] ?? 0} loading={loading} />)}
      </div>
    </section>
  );
}
