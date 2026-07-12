import { CircleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function FormErrorAlert({ error, title = "Unable to save changes" }) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-destructive/25 bg-destructive/5">
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{error.message ?? "The request could not be completed."}</p>
        {error.requestId ? (
          <p className="mt-1 text-xs tabular-nums">Request ID: {error.requestId}</p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
