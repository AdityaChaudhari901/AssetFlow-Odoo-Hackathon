import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isValid, parseISO } from "date-fns";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RouteLoading } from "@/components/shared/route-loading";
import { SearchSelect } from "@/components/shared/search-select";
import { ActivityList } from "@/features/activity/components/activity-list";
import { useActivityLogs } from "@/hooks/queries/use-activity-logs";
import { useEmployees } from "@/hooks/queries/use-organization";

const ENTITY_TYPES = ["all", "asset", "allocation", "transfer", "booking", "maintenance", "audit"];
const activityFilterSchema = z.object({
  action: z.string().trim().max(100, "Action filter must be 100 characters or fewer."),
});

export function ActivityLogsPage() {
  const [params, setParams] = useSearchParams();
  const actionFromUrl = params.get("action") || "";
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(activityFilterSchema),
    defaultValues: { action: actionFromUrl },
  });
  const page = Math.max(1, Number(params.get("page")) || 1);
  const entityType = params.get("entity_type") || "all";
  const actorId = params.get("actor_id") || "";
  const requestedFrom = params.get("from") || "";
  const requestedTo = params.get("to") || "";
  const parsedFrom = requestedFrom ? parseISO(requestedFrom) : null;
  const parsedTo = requestedTo ? parseISO(requestedTo) : null;
  const fromValid = Boolean(parsedFrom && isValid(parsedFrom));
  const toValid = Boolean(parsedTo && isValid(parsedTo));
  const chronological = !fromValid || !toValid || parsedFrom <= parsedTo;
  const from = fromValid && chronological ? requestedFrom : "";
  const to = toValid && chronological ? requestedTo : "";
  const queryParams = { page, limit: 20, ...(entityType !== "all" ? { entity_type: entityType } : {}), ...(actorId ? { actor_id: actorId } : {}), ...(params.get("action") ? { action: params.get("action") } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) };
  const query = useActivityLogs(queryParams);
  const employees = useEmployees({ status: "active", limit: 100 });
  const rows = query.data?.data ?? [];
  const meta = query.data?.meta;
  const totalPages = Math.max(1, Math.ceil((meta?.total ?? 0) / (meta?.limit ?? 20)));
  const employeeOptions = [{ value: "__all__", label: "All actors" }, ...(employees.data?.data ?? []).map((employee) => ({ value: employee.id, label: employee.full_name }))];
  const dateRange = from ? { from: parsedFrom, to: to ? parsedTo : undefined } : { from: undefined, to: undefined };

  useEffect(() => {
    reset({ action: actionFromUrl });
  }, [actionFromUrl, reset]);

  function update(values) {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([key, value]) => value && value !== "all" && value !== "1" ? next.set(key, value) : next.delete(key));
    if (!("page" in values)) next.delete("page");
    setParams(next, { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <PageHeader eyebrow="Immutable ledger" title="Activity" description="Trace important actions to an actor, resource, timestamp, and request boundary." actions={<Button variant="outline" className="h-11" onClick={() => query.refetch()}>Refresh</Button>} />
      <form className="grid gap-3 rounded-xl border border-border/80 bg-card p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_13rem_14rem_17rem_auto]" onSubmit={handleSubmit((values) => update({ action: values.action.trim() }))} noValidate>
        <div><div className="relative"><Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" /><Input className="h-11 pl-9" aria-label="Filter by action" aria-invalid={errors.action ? true : undefined} aria-describedby={errors.action ? "activity-action-error" : undefined} placeholder="Filter action, e.g. audit" {...register("action")} /></div>{errors.action ? <p id="activity-action-error" className="mt-1 text-xs text-destructive">{errors.action.message}</p> : null}</div>
        <Select value={entityType} onValueChange={(value) => update({ entity_type: value })}><SelectTrigger className="h-11 w-full" aria-label="Filter by entity type"><SelectValue /></SelectTrigger><SelectContent>{ENTITY_TYPES.map((value) => <SelectItem key={value} value={value}>{value === "all" ? "All entities" : value[0].toUpperCase() + value.slice(1)}</SelectItem>)}</SelectContent></Select>
        <SearchSelect value={actorId || "__all__"} onValueChange={(value) => update({ actor_id: value === "__all__" ? "" : value })} options={employeeOptions} placeholder="All actors" ariaLabel="Filter by actor" loading={employees.isLoading} disabled={Boolean(employees.error)} />
        <DateRangePicker value={dateRange} onChange={(range) => update({ from: range.from ? format(range.from, "yyyy-MM-dd") : "", to: range.to ? format(range.to, "yyyy-MM-dd") : "" })} className="w-full" ariaLabel="Filter activity by date range" />
        <Button type="submit" className="h-11">Apply filters</Button>
      </form>
      {employees.error ? <QueryErrorState title="Actor filter options are unavailable" error={employees.error} onRetry={employees.refetch} compact /> : null}
      {query.isLoading ? <RouteLoading label="Loading activity ledger" /> : null}
      {query.error ? <QueryErrorState error={query.error} onRetry={query.refetch} /> : null}
      {!query.isLoading && !query.error && !rows.length ? <EmptyState title="No activity matches these filters" description="Clear or change the filters to inspect another part of the ledger." /> : null}
      {rows.length ? <div className="rounded-xl border border-border/80 bg-card p-5"><ActivityList rows={rows} /></div> : null}
      {totalPages > 1 ? <div className="flex items-center justify-between"><p className="text-xs tabular-nums text-muted-foreground">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" className="h-10" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>Previous</Button><Button variant="outline" className="h-10" disabled={page >= totalPages} onClick={() => update({ page: String(page + 1) })}>Next</Button></div></div> : null}
    </div>
  );
}
