import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordField({
  id,
  label,
  registration,
  error,
  hint,
  action,
  disabled = false,
  autoComplete,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const toggleLabel = isVisible ? "Hide password" : "Show password";

  return (
    <div className="space-y-2">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          className="h-11 px-3 pr-12"
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          {...registration}
        />
        <Button
          type="button"
          variant="ghost"
          className="absolute inset-y-0 right-0 h-11 w-11 rounded-l-none text-muted-foreground hover:text-foreground"
          disabled={disabled}
          aria-label={toggleLabel}
          aria-controls={id}
          aria-pressed={isVisible}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>
      {hint ? (
        <p id={hintId} className="text-xs leading-5 text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs leading-5 text-destructive">
          {error.message}
        </p>
      ) : null}
    </div>
  );
}
