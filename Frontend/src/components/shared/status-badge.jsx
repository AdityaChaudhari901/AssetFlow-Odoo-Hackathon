import { Circle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BADGE_CLASSES, STATUS_CONFIG } from "@/lib/constants";
import { titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ kind, value, label, className }) {
  const configuration = STATUS_CONFIG[kind]?.[value];
  const color = configuration?.color ?? "state-inactive";
  const accessibleLabel = label ?? configuration?.label ?? titleCase(value);

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 whitespace-nowrap font-medium",
        BADGE_CLASSES[color] ?? BADGE_CLASSES["state-inactive"],
        className,
      )}
    >
      <Circle className="size-1.5 fill-current" aria-hidden="true" />
      {accessibleLabel}
    </Badge>
  );
}
