import { useEffect, useRef } from "react";
import { CircleAlert } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export function AuthErrorAlert({
  error,
  title = "Unable to continue",
  focusOnMount = false,
}) {
  const alertRef = useRef(null);

  useEffect(() => {
    if (error && focusOnMount) {
      alertRef.current?.focus();
    }
  }, [error?.message, focusOnMount]);

  if (!error) {
    return null;
  }

  return (
    <Alert
      ref={alertRef}
      variant="destructive"
      className="border-destructive/30 bg-destructive/5"
      tabIndex={focusOnMount ? -1 : undefined}
    >
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{error.message}</p>
        {error.requestId ? (
          <p className="mt-1 text-xs tabular-nums opacity-80">
            Request ID: {error.requestId}
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
