import { Skeleton } from "@/components/ui/skeleton";
import { MaintenanceKanbanCard } from "@/features/maintenance/components/maintenance-kanban-card";
import { cn } from "@/lib/utils";

export function MaintenanceKanbanColumn({
  column,
  requests,
  loading,
  onSelect,
  singleColumn = false,
}) {
  const headingId = `maintenance-column-${column.value}`;

  return (
    <section
      className={cn(
        "flex min-h-[34rem] shrink-0 snap-start flex-col border-r border-border/70 last:border-r-0 lg:min-h-[calc(100vh-19rem)]",
        singleColumn ? "w-full" : "w-[84vw] sm:w-72 xl:min-w-60 xl:flex-1",
      )}
      aria-labelledby={headingId}
    >
      <header className="grid min-h-24 shrink-0 place-items-center border-b border-border/70 bg-card px-4 py-5 text-center">
        <h2 id={headingId} className="text-base font-semibold leading-6 text-foreground">
          {column.label}
        </h2>
        <span className="sr-only">{requests.length} requests</span>
      </header>

      <div className="flex-1 space-y-3 bg-background/25 p-3">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))
        ) : requests.length > 0 ? (
          requests.map((request) => (
            <MaintenanceKanbanCard
              key={request.id}
              request={request}
              cardClassName={column.cardClassName}
              onSelect={onSelect}
            />
          ))
        ) : (
          <div className="grid min-h-24 place-items-center px-4 text-center">
            <p className="text-xs leading-5 text-muted-foreground">
              No requests in this stage.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
