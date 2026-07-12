import { fixtureEnvelope, fixtureReports, fixtureResult } from "@/api/__fixtures__/store";

export const getUtilizationFixture = () => fixtureResult(fixtureEnvelope(fixtureReports.utilization));

export function getMaintenanceFrequencyFixture(params = {}) {
  const prefix = params.group_by === "category" ? "cat-" : "asset-";
  return fixtureResult(fixtureEnvelope(fixtureReports.maintenance.filter((item) => item.key.startsWith(prefix))));
}

export const getAttentionFixture = () => fixtureResult(fixtureEnvelope(fixtureReports.attention));
export const getDepartmentAllocationFixture = () => fixtureResult(fixtureEnvelope(fixtureReports.departments));
export const getBookingHeatmapFixture = () => fixtureResult(fixtureEnvelope({ cells: fixtureReports.heatmap }));

function csvCell(value) {
  const raw = String(value ?? "");
  const text = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export async function exportReportFixture(report, params = {}) {
  let headings = [];
  let rows = [];
  if (report === "utilization") {
    headings = ["Asset tag", "Asset", "Allocated days", "Utilization percent"];
    rows = fixtureReports.utilization.map((item) => [item.asset.asset_tag, item.asset.name, item.allocated_days, item.utilization_pct]);
  } else if (report === "maintenance-frequency") {
    headings = ["Name", "Requests", "Resolved", "Total cost"];
    const prefix = params.group_by === "category" ? "cat-" : "asset-";
    rows = fixtureReports.maintenance
      .filter((item) => item.key.startsWith(prefix))
      .map((item) => [item.name, item.request_count, item.resolved_count, item.total_cost]);
  } else if (report === "department-allocation") {
    headings = ["Department", "Allocated assets", "Acquisition cost"];
    rows = fixtureReports.departments.map((item) => [item.department.name, item.allocated_count, item.total_acquisition_cost]);
  } else if (report === "booking-heatmap") {
    headings = ["Weekday", "Hour", "Booking count"];
    rows = fixtureReports.heatmap.map((item) => [item.weekday, item.hour, item.count]);
  } else {
    headings = ["Asset tag", "Asset", "Reasons"];
    rows = fixtureReports.attention.map((item) => [item.asset.asset_tag, item.asset.name, item.reasons.join("; ")]);
  }
  const csv = [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  return fixtureResult(new Blob([csv], { type: "text/csv;charset=utf-8" }));
}
