import { fmtDateTime, fmtRelative } from "@/lib/format";

export function RelativeTime({ value, className }) {
  return (
    <time dateTime={value} title={fmtDateTime(value)} className={className}>
      {fmtRelative(value)}
    </time>
  );
}
