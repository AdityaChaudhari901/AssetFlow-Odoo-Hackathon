import { useQuery } from "@tanstack/react-query";

import {
  getAttentionReport,
  getBookingHeatmapReport,
  getDepartmentAllocationReport,
  getMaintenanceFrequencyReport,
  getUtilizationReport,
} from "@/api/reports";
import { queryKeys } from "@/hooks/queries/query-keys";

const REPORT_STALE_TIME = 300_000;

export const useUtilizationReport = (params, enabled = true) => useQuery({ queryKey: queryKeys.reports("utilization", params), queryFn: ({ signal }) => getUtilizationReport(params, signal), enabled, staleTime: REPORT_STALE_TIME });
export const useMaintenanceReport = (params, enabled = true) => useQuery({ queryKey: queryKeys.reports("maintenance-frequency", params), queryFn: ({ signal }) => getMaintenanceFrequencyReport(params, signal), enabled, staleTime: REPORT_STALE_TIME });
export const useAttentionReport = (enabled = true) => useQuery({ queryKey: queryKeys.reports("attention"), queryFn: ({ signal }) => getAttentionReport(signal), enabled, staleTime: REPORT_STALE_TIME });
export const useDepartmentAllocationReport = (enabled = true) => useQuery({ queryKey: queryKeys.reports("department-allocation"), queryFn: ({ signal }) => getDepartmentAllocationReport(signal), enabled, staleTime: REPORT_STALE_TIME });
export const useBookingHeatmapReport = (params, enabled = true) => useQuery({ queryKey: queryKeys.reports("booking-heatmap", params), queryFn: ({ signal }) => getBookingHeatmapReport(params, signal), enabled, staleTime: REPORT_STALE_TIME });
