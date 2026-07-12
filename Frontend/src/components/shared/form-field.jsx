import { Label } from "@/components/ui/label";

export function FormField({ id, label, hint, error, required = false, children }) {
  const hintId = hint ? `${id}-hint` : null;
  const errorId = error ? `${id}-error` : null;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive" aria-hidden="true">*</span> : null}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
      })}
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
