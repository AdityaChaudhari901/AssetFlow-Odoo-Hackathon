import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  cancelBooking,
  createBooking,
  listBookableResources,
  listBookings,
  rescheduleBooking,
} from "@/api/bookings";
import { queryKeys } from "@/hooks/queries/query-keys";

async function invalidateBookings(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    queryClient.invalidateQueries({ queryKey: ["kpis"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] }),
    queryClient.invalidateQueries({ queryKey: ["activity"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["unread-count"] }),
  ]);
}

export function useBookableResources(params = {}) {
  return useQuery({
    queryKey: queryKeys.assets({ ...params, is_bookable: true, picker: "booking" }),
    queryFn: ({ signal }) => listBookableResources(params, signal),
  });
}

export function useBookings(params, options = {}) {
  return useQuery({
    queryKey: queryKeys.bookings(params),
    queryFn: ({ signal }) => listBookings(params, signal),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createBooking, onSettled: () => invalidateBookings(queryClient) });
}

export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => rescheduleBooking(id, payload),
    onSettled: () => invalidateBookings(queryClient),
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => cancelBooking(id, payload),
    onSettled: () => invalidateBookings(queryClient),
  });
}
