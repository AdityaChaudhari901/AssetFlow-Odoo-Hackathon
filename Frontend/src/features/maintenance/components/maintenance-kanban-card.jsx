import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MaintenanceKanbanCard({ request, cardClassName, onSelect }) {
  const asset = request.asset ?? {};
  const assetLabel = asset.asset_tag
    ? `${asset.asset_tag}: ${request.title}`
    : request.title;
  const isResolved = request.status === "resolved";
  const resolvedDate = request.resolved_at ?? request.updated_at;
  const statusNote = isResolved
    ? resolvedDate ? `Resolved ${fmtDate(resolvedDate)}` : "Resolved"
    : request.technician_name ? `Tech: ${request.technician_name}` : null;

  return (
    <article
      className={cn(
        "group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-opacity hover:opacity-90 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background",
        cardClassName,
      )}
    >
      <button
        type="button"
        className="absolute inset-0 z-10 cursor-pointer rounded-xl focus-visible:outline-none"
        aria-label={`Open maintenance request ${assetLabel}, ${request.priority} priority`}
        onClick={() => onSelect(request)}
      />

      <p
        className={cn(
          "font-mono text-sm font-semibold tracking-[0.04em]",
          isResolved ? "text-success" : "text-foreground",
        )}
      >
        {asset.asset_tag ?? "TAG UNAVAILABLE"}
      </p>
      <p
        className={cn(
          "mt-1 line-clamp-1 text-sm font-medium",
          isResolved ? "text-success" : "text-foreground",
        )}
      >
        {asset.name ?? "Unknown asset"}
      </p>
      <p
        className={cn(
          "mt-1 line-clamp-2 text-sm leading-5",
          isResolved ? "text-success" : "text-muted-foreground",
        )}
      >
        {request.title}
      </p>
      {statusNote ? (
        <p
          className={cn(
            "mt-2 truncate text-xs font-medium",
            isResolved ? "text-success" : "text-muted-foreground",
          )}
        >
          {statusNote}
        </p>
      ) : null}
    </article>
  );
}
