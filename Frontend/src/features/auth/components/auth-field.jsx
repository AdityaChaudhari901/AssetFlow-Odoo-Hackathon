import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthField({
  id,
  label,
  registration,
  error,
  hint,
  className,
  ...inputProps
}) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className={`h-11 px-3 ${className ?? ""}`}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        {...registration}
        {...inputProps}
      />
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
