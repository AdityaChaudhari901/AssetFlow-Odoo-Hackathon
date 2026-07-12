import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  closeAudit,
  createAudit,
  getAudit,
  listAuditDiscrepancies,
  listAuditOptions,
  listAudits,
  updateAuditRecord,
} from "@/api/audits";
import { queryKeys } from "@/hooks/queries/query-keys";

function recalculateProgress(records = []) {
  return records.reduce(
    (progress, record) => ({ ...progress, [record.result]: progress[record.result] + 1 }),
    { total: records.length, verified: 0, missing: 0, damaged: 0, pending: 0 },
  );
}

export const useAudits = (params) => useQuery({ queryKey: queryKeys.audits(params), queryFn: ({ signal }) => listAudits(params, signal) });
export const useAudit = (id) => useQuery({ queryKey: queryKeys.audit(id), queryFn: ({ signal }) => getAudit(id, signal), enabled: Boolean(id) });
export const useAuditDiscrepancies = (id, enabled = true) => useQuery({ queryKey: queryKeys.discrepancies(id), queryFn: ({ signal }) => listAuditDiscrepancies(id, signal), enabled: Boolean(id) && enabled });
export const useAuditOptions = (enabled = true) => useQuery({ queryKey: ["audit-options"], queryFn: ({ signal }) => listAuditOptions(signal), enabled, staleTime: 60_000 });

export function useCreateAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createAudit,
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: ["audits"] }),
      client.invalidateQueries({ queryKey: ["activity"] }),
    ]),
  });
}

export function useUpdateAuditRecord(auditId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload) => updateAuditRecord(auditId, payload),
    onMutate: async (payload) => {
      await client.cancelQueries({ queryKey: queryKeys.audit(auditId) });
      const previous = client.getQueryData(queryKeys.audit(auditId));
      client.setQueryData(queryKeys.audit(auditId), (current) => {
        if (!current?.data?.records) return current;
        const records = current.data.records.map((record) =>
          record.asset.id === payload.asset_id
            ? { ...record, result: payload.result, notes: payload.notes || null }
            : record,
        );
        return { ...current, data: { ...current.data, records, progress: recalculateProgress(records) } };
      });
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) client.setQueryData(queryKeys.audit(auditId), context.previous);
    },
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: ["audits"] }),
      client.invalidateQueries({ queryKey: queryKeys.audit(auditId) }),
      client.invalidateQueries({ queryKey: queryKeys.discrepancies(auditId) }),
      client.invalidateQueries({ queryKey: ["activity"] }),
      client.invalidateQueries({ queryKey: ["notifications"] }),
      client.invalidateQueries({ queryKey: queryKeys.unreadCount() }),
      client.invalidateQueries({ queryKey: ["asset-history"] }),
    ]),
  });
}

export function useCloseAudit(auditId) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => closeAudit(auditId),
    onSuccess: () => Promise.all([
      client.invalidateQueries({ queryKey: ["audits"] }),
      client.invalidateQueries({ queryKey: queryKeys.audit(auditId) }),
      client.invalidateQueries({ queryKey: queryKeys.discrepancies(auditId) }),
      client.invalidateQueries({ queryKey: ["assets"] }),
      client.invalidateQueries({ queryKey: ["asset"] }),
      client.invalidateQueries({ queryKey: ["asset-history"] }),
      client.invalidateQueries({ queryKey: ["reports"] }),
      client.invalidateQueries({ queryKey: queryKeys.kpis() }),
      client.invalidateQueries({ queryKey: ["notifications"] }),
      client.invalidateQueries({ queryKey: queryKeys.unreadCount() }),
      client.invalidateQueries({ queryKey: ["activity"] }),
    ]),
    onSettled: () => Promise.all([
      client.invalidateQueries({ queryKey: ["audits"] }),
      client.invalidateQueries({ queryKey: queryKeys.audit(auditId) }),
      client.invalidateQueries({ queryKey: queryKeys.discrepancies(auditId) }),
      client.invalidateQueries({ queryKey: ["asset"] }),
      client.invalidateQueries({ queryKey: ["asset-history"] }),
    ]),
  });
}
