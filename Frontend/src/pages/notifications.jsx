import { PagePlaceholder } from "@/components/shared/page-placeholder";

export function NotificationsPage() {
  return (
    <PagePlaceholder
      eyebrow="Inbox"
      title="Notifications"
      description="Review assignments, booking events, approvals, overdue returns, and audit exceptions in chronological order."
      nextStep="F8 adds polling, unread state, entity navigation, grouping, and bulk read actions."
    />
  );
}
