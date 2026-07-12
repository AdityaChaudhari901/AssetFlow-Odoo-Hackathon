import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { EmptyState } from "@/components/shared/empty-state";
import { fmtCurrency, fmtNumber } from "@/lib/format";

export function DepartmentAllocationChart({ rows = [] }) {
  if (!rows.length) return <EmptyState title="No department allocation data" description="Department totals will appear once assets have accountable custody." />;
  const chartRows = rows.map((item) => ({
    name: item.department.name,
    value: Number(item.allocated_count) || 0,
  }));
  const colors = [
    "var(--chart-1)",
    "var(--chart-2)",
    "var(--chart-3)",
    "var(--chart-4)",
    "var(--chart-5)",
  ];
  return (
    <div className="space-y-5">
      <figure><figcaption className="mb-3 text-sm font-medium">Allocated assets by department</figcaption><div className="h-80" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartRows} dataKey="value" nameKey="name" innerRadius="42%" outerRadius="72%" paddingAngle={2} isAnimationActive={false}>{chartRows.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => [fmtNumber(value), "Allocated assets"]} /><Legend /></PieChart></ResponsiveContainer></div></figure>
      <div className="overflow-x-auto rounded-xl border border-border/80"><table className="w-full min-w-[34rem] text-sm"><caption className="sr-only">Department allocation data</caption><thead className="bg-muted/35 text-left"><tr><th className="px-4 py-3">Department</th><th className="px-4 py-3">Allocated</th><th className="px-4 py-3">Acquisition cost</th></tr></thead><tbody className="divide-y divide-border/70">{rows.map((item) => <tr key={item.department.id}><td className="px-4 py-3 font-medium">{item.department.name}</td><td className="px-4 py-3 tabular-nums">{fmtNumber(item.allocated_count)}</td><td className="px-4 py-3 tabular-nums">{fmtCurrency(item.total_acquisition_cost)}</td></tr>)}</tbody></table></div>
    </div>
  );
}
