import { useEffect, useState } from "react";
import { Plus, Wrench } from "lucide-react";
import { useSearchParams } from "react-router";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { MaintenanceDetailSheet } from "@/features/maintenance/components/maintenance-detail-sheet";
import { MaintenanceList } from "@/features/maintenance/components/maintenance-list";
import { RaiseMaintenanceDialog } from "@/features/maintenance/components/raise-maintenance-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useMaintenance } from "@/hooks/queries/use-maintenance";
import { APP_ROLES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

const STATUSES = ["all", "pending", "approved", "assigned", "in_progress", "resolved", "rejected"];

export function MaintenancePage() {
  const { isManager, user } = useAuth();
  const isEmployee = user?.role === APP_ROLES.EMPLOYEE;
  const [searchParams, setSearchParams] = useSearchParams();
  const status = STATUSES.includes(searchParams.get("status")) ? searchParams.get("status") : "all";
  const priority = ["low", "medium", "high", "critical"].includes(searchParams.get("priority")) ? searchParams.get("priority") : "all";
  const mine = searchParams.has("mine") ? searchParams.get("mine") === "true" : isEmployee;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const query = useMaintenance({ status: status === "all" ? undefined : status, priority: priority === "all" ? undefined : priority, mine: mine || undefined, page, limit: 20 });
  const [raiseOpen, setRaiseOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const requestedAssetId = searchParams.get("asset_id") ?? "";

  useEffect(() => {
    if (!['true', '1'].includes(searchParams.get("create")) && searchParams.get("action") !== "raise") return;
    setRaiseOpen(true);
    const params = new URLSearchParams(searchParams);
    params.delete("create");
    params.delete("action");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  function updateParams(changes) {
    const params = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => value == null ? params.delete(key) : params.set(key, String(value)));
    setSearchParams(params, { replace: true });
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader eyebrow="Service workflow" title="Maintenance" description="Move reported issues through approval, technician assignment, active repair, and resolution without losing asset state." actions={<Button onClick={() => setRaiseOpen(true)}><Plus aria-hidden="true" /> Raise request</Button>} />

      <div className="space-y-4 rounded-xl border border-border/80 bg-card p-4">
        <Tabs value={status} onValueChange={(value) => updateParams({ status: value === "all" ? null : value, page: 1 })}>
          <TabsList className="h-auto w-full justify-start overflow-x-auto">
            {STATUSES.map((value) => <TabsTrigger key={value} value={value}>{titleCase(value)}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Priority</span>
            <Select value={priority} onValueChange={(value) => updateParams({ priority: value === "all" ? null : value, page: 1 })}>
              <SelectTrigger className="h-10 w-40" aria-label="Filter by priority"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All priorities</SelectItem>{["low", "medium", "high", "critical"].map((value) => <SelectItem key={value} value={value}>{titleCase(value)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm font-medium">
            <Switch checked={mine} onCheckedChange={(checked) => updateParams({ mine: checked, page: 1 })} aria-label="Show only requests raised by me" />
            My requests only
          </label>
        </div>
      </div>

      <MaintenanceList query={query} page={page} onPageChange={(value) => updateParams({ page: value })} onSelect={(row) => setSelectedId(row.id)} />

      <RaiseMaintenanceDialog open={raiseOpen} onOpenChange={setRaiseOpen} assetId={requestedAssetId} />
      <MaintenanceDetailSheet requestId={selectedId} open={Boolean(selectedId)} onOpenChange={(open) => !open && setSelectedId(null)} canManage={isManager} />
      {!query.isLoading && !query.error && query.data?.data?.length === 0 && mine ? <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Wrench className="size-3.5" aria-hidden="true" />Turn off “My requests only” to view the organization queue.</p> : null}
    </section>
  );
}
