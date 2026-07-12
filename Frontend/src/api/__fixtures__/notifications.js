import { fixtureDb, fixtureEnvelope, fixtureResult, paginateFixture } from "@/api/__fixtures__/store";

export async function listNotificationFixtures(params = {}) {
  const rows = params.unread_only
    ? fixtureDb.notifications.filter((item) => !item.is_read)
    : fixtureDb.notifications;
  const page = paginateFixture(rows, params);
  return fixtureResult(fixtureEnvelope(page.data, page.meta));
}

export async function getUnreadCountFixture() {
  return fixtureResult(fixtureEnvelope({ count: fixtureDb.notifications.filter((item) => !item.is_read).length }));
}

export async function markNotificationReadFixture(id) {
  const notification = fixtureDb.notifications.find((item) => item.id === id);
  if (notification) notification.is_read = true;
  return fixtureResult(fixtureEnvelope(notification));
}

export async function markAllNotificationsReadFixture() {
  fixtureDb.notifications.forEach((item) => { item.is_read = true; });
  return fixtureResult(fixtureEnvelope({ updated: fixtureDb.notifications.length }));
}
