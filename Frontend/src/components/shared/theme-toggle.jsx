import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const label = `Switch to ${dark ? "light" : "dark"} mode`;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn("relative size-9", className)}
      aria-label={label}
      aria-pressed={dark}
      title={label}
      onClick={toggleTheme}
    >
      <Sun
        className="size-4 scale-100 rotate-0 transition-transform duration-200 dark:-rotate-90 dark:scale-0"
        aria-hidden="true"
      />
      <Moon
        className="absolute size-4 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100"
        aria-hidden="true"
      />
    </Button>
  );
}
