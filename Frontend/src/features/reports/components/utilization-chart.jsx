import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { fmtNumber } from "@/lib/format";

export function UtilizationChart({ rows = [] }) {
  if (!rows.length) return <EmptyState title="No utilization data" description="Choose another reporting range after allocation history is available." />;
  const chartRows = [...rows].sort((a, b) => b.utilization_pct - a.utilization_pct).slice(0, 10);
  const idle = rows.filter((item) => Number(item.utilization_pct) === 0);
  return (
    <div className="space-y-6">
      <figure>
        <figcaption className="mb-3 text-sm font-medium">Top assets by utilized days</figcaption>
        <div className="h-80 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartRows} layout="vertical" margin={{ left: 8, right: 28 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="asset.asset_tag" width={72} />
              <Tooltip formatter={(value) => [`${value}%`, "Utilization"]} labelFormatter={(_label, payload) => payload?.[0]?.payload?.asset?.name ?? "Asset"} />
              <Bar dataKey="utilization_pct" fill="var(--chart-1)" radius={[0, 4, 4, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className="w-full min-w-[34rem] text-sm"><caption className="sr-only">Asset utilization data</caption><thead className="bg-muted/35 text-left"><tr><th className="px-4 py-3">Asset</th><th className="px-4 py-3">Allocated days</th><th className="px-4 py-3">Utilization</th></tr></thead><tbody className="divide-y divide-border/70">{chartRows.map((item) => <tr key={item.asset.id}><td className="px-4 py-3"><span className="font-medium">{item.asset.name}</span><span className="ml-2 text-xs tabular-nums text-muted-foreground">{item.asset.asset_tag}</span></td><td className="px-4 py-3 tabular-nums">{fmtNumber(item.allocated_days)}</td><td className="px-4 py-3 tabular-nums">{item.utilization_pct}%</td></tr>)}</tbody></table>
      </div>
      <section aria-labelledby="idle-assets-title"><h3 id="idle-assets-title" className="mb-3 font-semibold">Idle assets</h3>{idle.length ? <ul className="divide-y divide-border/70 rounded-xl border border-border/80">{idle.map((item) => <li key={item.asset.id} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{item.asset.asset_tag} · {item.asset.name}</span><span className="text-muted-foreground">0% utilized</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No idle assets in this range.</p>}</section>
    </div>
  );
}
