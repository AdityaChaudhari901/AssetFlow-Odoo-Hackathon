import { download, request } from "@/api/transport";
import {
  exportReportFixture,
  getAttentionFixture,
  getBookingHeatmapFixture,
  getDepartmentAllocationFixture,
  getMaintenanceFrequencyFixture,
  getUtilizationFixture,
} from "@/api/__fixtures__/reports";

export const getUtilizationReport = (params, signal) => request({ method: "get", url: "/reports/utilization", params, signal }, getUtilizationFixture);
export const getMaintenanceFrequencyReport = (params, signal) => request({ method: "get", url: "/reports/maintenance-frequency", params, signal }, () => getMaintenanceFrequencyFixture(params));
export const getAttentionReport = (signal) => request({ method: "get", url: "/reports/attention", signal }, getAttentionFixture);
export const getDepartmentAllocationReport = (signal) => request({ method: "get", url: "/reports/department-allocation", signal }, getDepartmentAllocationFixture);
export const getBookingHeatmapReport = (params, signal) => request({ method: "get", url: "/reports/booking-heatmap", params, signal }, getBookingHeatmapFixture);
export const exportReport = (report, params = {}) => download(
  { method: "get", url: "/reports/export", params: { report, format: "csv", ...params } },
  () => exportReportFixture(report, params),
);
