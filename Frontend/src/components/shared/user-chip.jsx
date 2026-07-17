import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "U"
  );
}

export function UserChip({ user, secondary, compact = false, className }) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar className={compact ? "size-7" : "size-9"}>
        <AvatarImage src={user?.avatar_url ?? undefined} alt="" />
        <AvatarFallback className="text-[0.68rem] font-semibold">
          {initials(user?.full_name ?? user?.name)}
        </AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">
          {user?.full_name ?? user?.name ?? "Unassigned"}
        </span>
        {secondary ? (
          <span className="block truncate text-xs text-muted-foreground">{secondary}</span>
        ) : null}
      </span>
    </div>
  );
}
