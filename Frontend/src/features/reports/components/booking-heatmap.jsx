import { EmptyState } from "@/components/shared/empty-state";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 15 }, (_, index) => index + 7);
const HEAT_CLASSES = ["bg-muted/20", "bg-chart-3/15", "bg-chart-3/25", "bg-chart-3/40", "bg-chart-3/60 text-primary-foreground"];

function heatClass(count, max) {
  if (!count || !max) return HEAT_CLASSES[0];
  return HEAT_CLASSES[Math.min(4, Math.max(1, Math.ceil((count / max) * 4)))];
}

export function BookingHeatmap({ cells = [] }) {
  const max = Math.max(0, ...cells.map((cell) => Number(cell.count) || 0));
  if (!cells.length || max === 0) return <EmptyState title="No bookings in this range" description="Choose another date range or resource to inspect booking demand." />;
  const lookup = new Map(cells.map((cell) => [`${cell.weekday}-${cell.hour}`, Number(cell.count) || 0]));
  return (
    <figure>
      <figcaption className="mb-3 text-sm font-medium">Bookings by weekday and hour</figcaption>
      <div className="overflow-x-auto rounded-xl border border-border/80">
        <table className="w-full min-w-[58rem] border-collapse text-center text-xs">
          <caption className="sr-only">Booking counts from 7 AM through 9 PM for each weekday</caption>
          <thead><tr className="bg-muted/35"><th className="sticky left-0 z-10 bg-muted px-3 py-3 text-left">Day</th>{HOURS.map((hour) => <th key={hour} className="px-2 py-3 font-medium">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? " PM" : " AM"}</th>)}</tr></thead>
          <tbody>{DAYS.map((day, weekday) => <tr key={day} className="border-t border-border/70"><th className="sticky left-0 z-10 bg-card px-3 py-3 text-left font-medium">{day}</th>{HOURS.map((hour) => { const count = lookup.get(`${weekday}-${hour}`) ?? 0; const label = `${day} at ${hour}:00, ${count} bookings`; return <td key={hour} className="p-1"><span className={`grid min-h-9 place-items-center rounded-md tabular-nums ${heatClass(count, max)}`} aria-label={label} title={label}>{count}</span></td>; })}</tr>)}</tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Darker cells indicate higher demand. Exact booking counts are printed in every cell.</p>
    </figure>
  );
}
