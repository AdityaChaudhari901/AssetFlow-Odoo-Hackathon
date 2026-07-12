import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/api/notifications";
import { queryKeys } from "@/hooks/queries/query-keys";

export const useNotifications = (params = {}, options = {}) => useQuery({
  queryKey: queryKeys.notifications(params),
  queryFn: ({ signal }) => listNotifications(params, signal),
  ...options,
});

export const useUnreadCount = () => useQuery({
  queryKey: queryKeys.unreadCount(),
  queryFn: ({ signal }) => getUnreadCount(signal),
  refetchInterval: 60_000,
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
});

function updateNotificationLists(client, updater) {
  client.setQueriesData({ queryKey: ["notifications"] }, (current) => {
    if (!current?.data) return current;
    return { ...current, data: updater(current.data) };
  });
}

export function useMarkNotificationRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ["notifications"] });
      const lists = client.getQueriesData({ queryKey: ["notifications"] });
      const count = client.getQueryData(queryKeys.unreadCount());
      let changed = false;
      updateNotificationLists(client, (rows) => rows.map((item) => {
        if (item.id !== id || item.is_read) return item;
        changed = true;
        return { ...item, is_read: true };
      }));
      if (changed) {
        client.setQueryData(queryKeys.unreadCount(), (current) => ({
          ...current,
          data: { count: Math.max(0, Number(current?.data?.count ?? 0) - 1) },
        }));
      }
      return { lists, count };
    },
    onError: (_error, _id, context) => {
      context?.lists?.forEach(([key, data]) => client.setQueryData(key, data));
      if (context?.count) client.setQueryData(queryKeys.unreadCount(), context.count);
    },
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: ["notifications"] }),
      client.invalidateQueries({ queryKey: queryKeys.unreadCount() }),
    ]),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await client.cancelQueries({ queryKey: ["notifications"] });
      const lists = client.getQueriesData({ queryKey: ["notifications"] });
      const count = client.getQueryData(queryKeys.unreadCount());
      updateNotificationLists(client, (rows) => rows.map((item) => ({ ...item, is_read: true })));
      client.setQueryData(queryKeys.unreadCount(), (current) => ({ ...current, data: { count: 0 } }));
      return { lists, count };
    },
    onError: (_error, _payload, context) => {
      context?.lists?.forEach(([key, data]) => client.setQueryData(key, data));
      if (context?.count) client.setQueryData(queryKeys.unreadCount(), context.count);
    },
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: ["notifications"] }),
      client.invalidateQueries({ queryKey: queryKeys.unreadCount() }),
    ]),
  });
}
