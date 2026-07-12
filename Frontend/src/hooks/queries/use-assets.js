import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  changeAssetStatus,
  createAsset,
  getAsset,
  getAssetHistory,
  listAssets,
  updateAsset,
} from "@/api/assets";
import { queryKeys } from "@/hooks/queries/query-keys";

function invalidateAssetWorkspace(queryClient, id) {
  void queryClient.invalidateQueries({ queryKey: ["assets"] });
  void queryClient.invalidateQueries({ queryKey: ["kpis"] });
  void queryClient.invalidateQueries({ queryKey: ["reports"] });
  void queryClient.invalidateQueries({ queryKey: ["activity"] });
  void queryClient.invalidateQueries({ queryKey: ["departments"] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.asset(id) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.assetHistory(id) });
  }
}

export function useAssets(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.assets(params),
    queryFn: ({ signal }) => listAssets(params, signal),
    placeholderData: keepPreviousData,
    ...options,
  });
}

export function useAsset(id) {
  return useQuery({
    queryKey: queryKeys.asset(id),
    queryFn: ({ signal }) => getAsset(id, signal),
    enabled: Boolean(id),
  });
}

export function useAssetHistory(id) {
  return useQuery({
    queryKey: queryKeys.assetHistory(id),
    queryFn: ({ signal }) => getAssetHistory(id, signal),
    enabled: Boolean(id),
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => invalidateAssetWorkspace(queryClient),
  });
}

export function useUpdateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateAsset(id, payload),
    onSuccess: (_response, variables) => invalidateAssetWorkspace(queryClient, variables.id),
  });
}

export function useChangeAssetStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => changeAssetStatus(id, payload),
    onSuccess: (_response, variables) => invalidateAssetWorkspace(queryClient, variables.id),
  });
}
