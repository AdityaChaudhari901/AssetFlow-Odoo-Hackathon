import { Skeleton } from "@/components/ui/skeleton";

export function RouteLoading({ label = "Loading AssetFlow" }) {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6"
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
