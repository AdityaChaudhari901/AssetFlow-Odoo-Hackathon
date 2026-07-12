import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAllocation,
  listAllocationAssets,
  listAllocationDepartments,
  listAllocationEmployees,
  listAllocations,
  requestAllocationReturn,
  returnAllocation,
} from "@/api/allocations";
import { queryKeys } from "@/hooks/queries/query-keys";

async function invalidateCustody(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["allocations"] }),
    queryClient.invalidateQueries({ queryKey: ["assets"] }),
    queryClient.invalidateQueries({ queryKey: ["asset"] }),
    queryClient.invalidateQueries({ queryKey: ["asset-history"] }),
    queryClient.invalidateQueries({ queryKey: ["employees"] }),
    queryClient.invalidateQueries({ queryKey: ["departments"] }),
    queryClient.invalidateQueries({ queryKey: ["kpis"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard-returns"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] }),
    queryClient.invalidateQueries({ queryKey: ["activity"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["unread-count"] }),
  ]);
}

export function useAllocations(params) {
  return useQuery({
    queryKey: queryKeys.allocations(params),
    queryFn: ({ signal }) => listAllocations(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useAllocationAssets(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.assets({ ...params, picker: "allocation" }),
    queryFn: ({ signal }) => listAllocationAssets(params, signal),
    ...options,
  });
}

export function useAllocationEmployees(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.employees({ ...params, picker: "allocation" }),
    queryFn: ({ signal }) => listAllocationEmployees(params, signal),
    ...options,
  });
}

export function useAllocationDepartments(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.departments({ ...params, picker: "allocation" }),
    queryFn: ({ signal }) => listAllocationDepartments(params, signal),
    ...options,
  });
}

export function useCreateAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAllocation,
    onSuccess: () => invalidateCustody(queryClient),
  });
}

export function useRequestAllocationReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestAllocationReturn,
    onSettled: () => invalidateCustody(queryClient),
  });
}

export function useReturnAllocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => returnAllocation(id, payload),
    onSettled: () => invalidateCustody(queryClient),
  });
}

export { invalidateCustody };
