import { PagePlaceholder } from "@/components/shared/page-placeholder";

export function MaintenancePage() {
  return (
    <PagePlaceholder
      eyebrow="Service workflow"
      title="Maintenance"
      description="Move reported issues through approval, technician assignment, active repair, and resolution without losing asset state."
      nextStep="F6 adds the maintenance queue, workflow stepper, approvals, technician assignment, and resolution."
    />
  );
}
