import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";

export function AuthSuccessState({ title, description, children }) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-lg border border-success-border bg-success-surface px-4 py-4 text-success">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <h2
            ref={headingRef}
            className="rounded-sm text-sm font-semibold"
            tabIndex={-1}
          >
            {title}
          </h2>
          <p className="text-sm leading-6">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
