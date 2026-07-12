import { useEffect, useState } from "react";
import { format, isValid, parseISO, subDays } from "date-fns";
import { RefreshCcw } from "lucide-react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RouteLoading } from "@/components/shared/route-loading";
import { AttentionTable } from "@/features/reports/components/attention-table";
import { BookingHeatmap } from "@/features/reports/components/booking-heatmap";
import { DepartmentAllocationChart } from "@/features/reports/components/department-allocation-chart";
import { ExportReportButton } from "@/features/reports/components/export-report-button";
import { MaintenanceFrequencyChart } from "@/features/reports/components/maintenance-frequency-chart";
import { UtilizationChart } from "@/features/reports/components/utilization-chart";
import {
  useAttentionReport,
  useBookingHeatmapReport,
  useDepartmentAllocationReport,
  useMaintenanceReport,
  useUtilizationReport,
} from "@/hooks/queries/use-reports";

const TODAY = new Date();
const DEFAULT_FROM = format(subDays(TODAY, 89), "yyyy-MM-dd");
const DEFAULT_TO = format(TODAY, "yyyy-MM-dd");
const REPORTS = ["utilization", "maintenance", "attention", "departments", "heatmap"];

function validDateParam(value, fallback) {
  const parsed = value ? parseISO(value) : null;
  return parsed && isValid(parsed) ? value : fallback;
}

function ReportPanel({ query, children }) {
  if (query.isLoading) return <RouteLoading label="Loading report" />;
  if (query.error) return <QueryErrorState error={query.error} onRetry={query.refetch} />;
  return children;
}

export function ReportsPage() {
  const [search, setSearch] = useSearchParams();
  const requestedReport = search.get("report");
  const active = REPORTS.includes(requestedReport) ? requestedReport : "utilization";
  const requestedFrom = validDateParam(search.get("from"), DEFAULT_FROM);
  const requestedTo = validDateParam(search.get("to"), DEFAULT_TO);
  const invertedRange = parseISO(requestedTo) < parseISO(requestedFrom);
  const from = invertedRange ? DEFAULT_FROM : requestedFrom;
  const to = invertedRange ? DEFAULT_TO : requestedTo;
  const groupBy = search.get("group_by") === "category" ? "category" : "asset";
  const rangeParams = { from, to };
  const dateValue = { from: parseISO(from), to: parseISO(to) };
  const [draftDateValue, setDraftDateValue] = useState(dateValue);
  const utilization = useUtilizationReport(rangeParams, active === "utilization");
  const maintenance = useMaintenanceReport({ group_by: groupBy }, active === "maintenance");
  const attention = useAttentionReport(active === "attention");
  const departments = useDepartmentAllocationReport(active === "departments");
  const heatmap = useBookingHeatmapReport(rangeParams, active === "heatmap");
  const activeQuery = { utilization, maintenance, attention, departments, heatmap }[active];
  const usesDateRange = ["utilization", "heatmap"].includes(active);

  useEffect(() => {
    setDraftDateValue(dateValue);
  }, [from, to]);

  function updateSearch(values) {
    const next = new URLSearchParams(search);
    Object.entries(values).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    setSearch(next, { replace: true });
  }

  function updateDates(range) {
    setDraftDateValue(range);
    if (!range.from || !range.to) return;
    updateSearch({ from: format(range.from, "yyyy-MM-dd"), to: format(range.to, "yyyy-MM-dd") });
  }

  const exportName = active === "maintenance" ? "maintenance-frequency" : active === "departments" ? "department-allocation" : active === "heatmap" ? "booking-heatmap" : active;
  const exportParams = active === "maintenance" ? { group_by: groupBy } : usesDateRange ? rangeParams : {};

  return (
    <div className="mx-auto w-full max-w-[100rem] space-y-7">
      <PageHeader eyebrow="Operational intelligence" title="Reports" description="Utilization, maintenance pressure, allocation, and booking demand with accessible source tables." actions={<div className="flex flex-wrap gap-2"><Button variant="outline" className="h-11" onClick={() => activeQuery.refetch()} disabled={activeQuery.isFetching}><RefreshCcw aria-hidden="true" />Refresh</Button><ExportReportButton report={exportName} params={exportParams} /></div>} />

      <Tabs value={active} onValueChange={(value) => updateSearch({ report: value })}>
        <TabsList variant="line" className="h-11 max-w-full justify-start overflow-x-auto">
          <TabsTrigger className="min-h-10 px-3" value="utilization">Utilization</TabsTrigger>
          <TabsTrigger className="min-h-10 px-3" value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger className="min-h-10 px-3" value="attention">Needs attention</TabsTrigger>
          <TabsTrigger className="min-h-10 px-3" value="departments">Departments</TabsTrigger>
          <TabsTrigger className="min-h-10 px-3" value="heatmap">Booking heatmap</TabsTrigger>
        </TabsList>

        {usesDateRange || active === "maintenance" ? <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          {usesDateRange ? <DateRangePicker value={draftDateValue} onChange={updateDates} className="w-full sm:w-auto" ariaLabel="Choose report date range" /> : null}
          {active === "maintenance" ? <Select value={groupBy} onValueChange={(value) => updateSearch({ group_by: value })}><SelectTrigger className="h-11 w-full sm:w-52" aria-label="Group maintenance report"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asset">Group by asset</SelectItem><SelectItem value="category">Group by category</SelectItem></SelectContent></Select> : null}
        </div> : null}

        <TabsContent value="utilization" className="mt-5"><section className="rounded-xl border border-border/80 bg-card p-5"><h2 className="mb-5 text-lg font-semibold">Asset utilization</h2><ReportPanel query={utilization}><UtilizationChart rows={utilization.data?.data ?? []} /></ReportPanel></section></TabsContent>
        <TabsContent value="maintenance" className="mt-5"><section className="rounded-xl border border-border/80 bg-card p-5"><h2 className="mb-5 text-lg font-semibold">Maintenance frequency</h2><ReportPanel query={maintenance}><MaintenanceFrequencyChart rows={maintenance.data?.data ?? []} /></ReportPanel></section></TabsContent>
        <TabsContent value="attention" className="mt-5"><section><h2 className="sr-only">Assets needing attention</h2><AttentionTable query={attention} /></section></TabsContent>
        <TabsContent value="departments" className="mt-5"><section className="rounded-xl border border-border/80 bg-card p-5"><h2 className="mb-5 text-lg font-semibold">Department allocation</h2><ReportPanel query={departments}><DepartmentAllocationChart rows={departments.data?.data ?? []} /></ReportPanel></section></TabsContent>
        <TabsContent value="heatmap" className="mt-5"><section className="rounded-xl border border-border/80 bg-card p-5"><h2 className="mb-5 text-lg font-semibold">Booking demand</h2><ReportPanel query={heatmap}><BookingHeatmap cells={heatmap.data?.data?.cells ?? []} /></ReportPanel></section></TabsContent>
      </Tabs>
    </div>
  );
}
