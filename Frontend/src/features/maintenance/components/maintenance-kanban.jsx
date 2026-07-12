import { Plus, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { MaintenanceKanbanColumn } from "@/features/maintenance/components/maintenance-kanban-column";
import { getVisibleMaintenanceColumns } from "@/features/maintenance/maintenance-kanban-config";

export function MaintenanceKanban({ query, status, onSelect, onRaiseRequest }) {
  const rows = query.data?.data ?? [];
  const total = query.data?.meta?.total ?? rows.length;
  const columns = getVisibleMaintenanceColumns(status);
  const visibleStatuses = new Set(columns.map((column) => column.value));
  const visibleRows = rows.filter((request) => visibleStatuses.has(request.status));
  const isInitialLoading = query.isLoading && rows.length === 0;
  const isSingleColumn = columns.length === 1;

  if (query.error) {
    return (
      <QueryErrorState
        error={query.error}
        title="We could not load the maintenance board"
        onRetry={query.refetch}
      />
    );
  }

  if (!isInitialLoading && rows.length === 0) {
    return (
      <EmptyState
        icon={Wrench}
        title="No maintenance requests found"
        description="Change the active filters or raise a request when an asset needs attention."
        action={
          <Button type="button" onClick={onRaiseRequest}>
            <Plus aria-hidden="true" />
            Raise request
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="maintenance-workflow-heading">
      <h2 id="maintenance-workflow-heading" className="sr-only">
        Maintenance workflow board
      </h2>
      <p className="sr-only" aria-live="polite">
        {query.isFetching && !query.isLoading ? "Refreshing. " : ""}
        {visibleRows.length} request{visibleRows.length === 1 ? "" : "s"} across {columns.length} stage{columns.length === 1 ? "" : "s"}.
      </p>
      <div
        className="overflow-x-auto rounded-2xl border border-border/80 bg-card overscroll-x-contain [scrollbar-color:var(--border)_transparent]"
        role="region"
        aria-label="Maintenance request workflow"
        tabIndex={0}
      >
        <div className="flex min-w-full snap-x snap-mandatory">
          {columns.map((column) => (
            <MaintenanceKanbanColumn
              key={column.value}
              column={column}
              requests={visibleRows.filter((request) => request.status === column.value)}
              loading={isInitialLoading}
              onSelect={onSelect}
              singleColumn={isSingleColumn}
            />
          ))}
        </div>
      </div>

      {total > rows.length ? (
        <p className="mt-3 text-xs text-muted-foreground">
          This board shows the newest {rows.length} matching requests. Narrow the filters to inspect older records.
        </p>
      ) : null}
    </section>
  );
}
