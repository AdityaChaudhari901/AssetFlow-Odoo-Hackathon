import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { RelativeTime } from "@/components/shared/relative-time";
import { UserChip } from "@/components/shared/user-chip";
import { ENTITY_ROUTE_MAP } from "@/lib/constants";
import { titleCase } from "@/lib/format";

function ActivityDetails({ log }) {
  const [open, setOpen] = useState(false);
  const detailsId = `activity-details-${log.id}`;
  return (
    <div>
      <Button type="button" variant="ghost" className="h-9 px-2" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpen((value) => !value)}>
        {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}Evidence
      </Button>
      {open ? <pre id={detailsId} className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted/40 p-3 text-xs leading-5 whitespace-pre-wrap break-words">{JSON.stringify(log.details ?? {}, null, 2)}</pre> : null}
    </div>
  );
}

export function ActivityList({ rows = [], compact = false }) {
  return (
    <div className="divide-y divide-border/70">
      {rows.map((log) => {
        const routeFactory = ENTITY_ROUTE_MAP[log.entity_type];
        const route =
          routeFactory && log.entity_id
            ? routeFactory(log.entity_id)
            : null;
        return (
          <article key={log.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-border bg-muted/30 px-2 py-1 font-mono text-xs font-medium">{log.action}</span><RelativeTime value={log.created_at} className="text-xs text-muted-foreground" /></div>
              <div className="mt-3"><UserChip user={log.actor} secondary={route ? undefined : log.entity_type} compact /></div>
              <p className="mt-2 truncate text-sm text-muted-foreground">{route ? <Link className="font-medium text-foreground underline-offset-4 hover:underline" to={route}>{log.entity_label ?? titleCase(log.entity_type)}</Link> : log.entity_label}</p>
            </div>
            {!compact ? <ActivityDetails log={log} /> : null}
          </article>
        );
      })}
    </div>
  );
}
