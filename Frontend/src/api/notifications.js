import { request } from "@/api/transport";
import {
  getUnreadCountFixture,
  listNotificationFixtures,
  markAllNotificationsReadFixture,
  markNotificationReadFixture,
} from "@/api/__fixtures__/notifications";

export const listNotifications = (params, signal) => request({ method: "get", url: "/notifications", params, signal }, () => listNotificationFixtures(params));
export const getUnreadCount = (signal) => request({ method: "get", url: "/notifications/unread-count", signal }, getUnreadCountFixture);
export const markNotificationRead = (id) => request({ method: "post", url: `/notifications/${id}/read` }, () => markNotificationReadFixture(id));
export const markAllNotificationsRead = () => request({ method: "post", url: "/notifications/read-all" }, markAllNotificationsReadFixture);
