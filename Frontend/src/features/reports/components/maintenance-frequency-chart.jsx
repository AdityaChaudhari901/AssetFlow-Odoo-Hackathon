import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { fmtCurrency, fmtNumber } from "@/lib/format";

export function MaintenanceFrequencyChart({ rows = [] }) {
  if (!rows.length) return <EmptyState title="No maintenance frequency data" description="Resolved and active requests will appear after maintenance activity is recorded." />;
  return (
    <div className="space-y-5">
      <figure><figcaption className="mb-3 text-sm font-medium">Requests and resolutions</figcaption><div className="h-72" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={rows}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="name" tickFormatter={(value) => value.length > 14 ? `${value.slice(0, 14)}…` : value} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="request_count" name="Requests" fill="var(--chart-4)" isAnimationActive={false} /><Bar dataKey="resolved_count" name="Resolved" fill="var(--chart-3)" isAnimationActive={false} /></BarChart></ResponsiveContainer></div></figure>
      <div className="overflow-x-auto rounded-xl border border-border/80"><table className="w-full min-w-[34rem] text-sm"><caption className="sr-only">Maintenance frequency data</caption><thead className="bg-muted/35 text-left"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Requests</th><th className="px-4 py-3">Resolved</th><th className="px-4 py-3">Cost</th></tr></thead><tbody className="divide-y divide-border/70">{rows.map((item) => <tr key={item.key}><td className="px-4 py-3 font-medium">{item.name}</td><td className="px-4 py-3 tabular-nums">{fmtNumber(item.request_count)}</td><td className="px-4 py-3 tabular-nums">{fmtNumber(item.resolved_count)}</td><td className="px-4 py-3 tabular-nums">{fmtCurrency(item.total_cost)}</td></tr>)}</tbody></table></div>
    </div>
  );
}
