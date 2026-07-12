import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveTransfer,
  createTransfer,
  listTransfers,
  rejectTransfer,
} from "@/api/transfers";
import { invalidateCustody } from "@/hooks/queries/use-allocations";
import { queryKeys } from "@/hooks/queries/query-keys";

async function invalidateTransfers(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["transfers"] }),
    invalidateCustody(queryClient),
  ]);
}

export function useTransfers(params) {
  return useQuery({
    queryKey: queryKeys.transfers(params),
    queryFn: ({ signal }) => listTransfers(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransfer,
    onSettled: () => invalidateTransfers(queryClient),
  });
}

export function useApproveTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: approveTransfer,
    onSettled: () => invalidateTransfers(queryClient),
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => rejectTransfer(id, payload),
    onSettled: () => invalidateTransfers(queryClient),
  });
}
