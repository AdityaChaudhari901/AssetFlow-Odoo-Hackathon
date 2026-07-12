import { PagePlaceholder } from "@/components/shared/page-placeholder";

export function ActivityLogsPage() {
  return (
    <PagePlaceholder
      eyebrow="Immutable ledger"
      title="Activity"
      description="Trace important workflow actions to an actor, resource, timestamp, and request identifier."
      nextStep="F8 adds server-side filtering, pagination, relative timestamps, and request-level traceability."
    />
  );
}
