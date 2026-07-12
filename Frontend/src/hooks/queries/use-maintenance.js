import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveMaintenance,
  assignMaintenance,
  createMaintenance,
  getMaintenance,
  listMaintenance,
  rejectMaintenance,
  resolveMaintenance,
  startMaintenance,
} from "@/api/maintenance";
import { queryKeys } from "@/hooks/queries/query-keys";

async function invalidateMaintenanceWorkspace(queryClient, id) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
    queryClient.invalidateQueries({ queryKey: ["assets"] }),
    queryClient.invalidateQueries({ queryKey: ["asset"] }),
    queryClient.invalidateQueries({ queryKey: ["asset-history"] }),
    queryClient.invalidateQueries({ queryKey: ["kpis"] }),
    queryClient.invalidateQueries({ queryKey: ["reports"] }),
    queryClient.invalidateQueries({ queryKey: ["activity"] }),
    queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    queryClient.invalidateQueries({ queryKey: ["unread-count"] }),
    id ? queryClient.invalidateQueries({ queryKey: queryKeys.maintenanceDetail(id) }) : Promise.resolve(),
  ]);
}

export function useMaintenance(params = {}) {
  return useQuery({
    queryKey: queryKeys.maintenance(params),
    queryFn: ({ signal }) => listMaintenance(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useMaintenanceDetail(id) {
  return useQuery({
    queryKey: queryKeys.maintenanceDetail(id),
    queryFn: ({ signal }) => getMaintenance(id, signal),
    enabled: Boolean(id),
  });
}

function useMaintenanceMutation(mutationFn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_response, variables) =>
      invalidateMaintenanceWorkspace(queryClient, variables?.id),
  });
}

export function useCreateMaintenance() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: createMaintenance, onSuccess: () => invalidateMaintenanceWorkspace(queryClient) });
}

export function useApproveMaintenance() {
  return useMaintenanceMutation(({ id }) => approveMaintenance(id));
}

export function useRejectMaintenance() {
  return useMaintenanceMutation(({ id, payload }) => rejectMaintenance(id, payload));
}

export function useAssignMaintenance() {
  return useMaintenanceMutation(({ id, payload }) => assignMaintenance(id, payload));
}

export function useStartMaintenance() {
  return useMaintenanceMutation(({ id }) => startMaintenance(id));
}

export function useResolveMaintenance() {
  return useMaintenanceMutation(({ id, payload }) => resolveMaintenance(id, payload));
}
