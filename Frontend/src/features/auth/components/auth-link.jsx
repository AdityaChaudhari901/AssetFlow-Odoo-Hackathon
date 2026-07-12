import { Link } from "react-router";

import { cn } from "@/lib/utils";

export function AuthLink({ disabled = false, className, onClick, ...props }) {
  function handleClick(event) {
    if (disabled) {
      event.preventDefault();
      return;
    }

    onClick?.(event);
  }

  return (
    <Link
      className={cn(
        "inline-flex min-h-11 items-center rounded-sm font-semibold text-primary underline-offset-4 hover:underline",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      onClick={handleClick}
      {...props}
    />
  );
}
