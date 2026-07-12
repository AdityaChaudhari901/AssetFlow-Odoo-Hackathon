import { MAINTENANCE_FLOW, STATUS_CONFIG } from "@/lib/constants";

const COLUMN_CARD_CLASSES = Object.freeze({
  pending: "border-border/90 bg-card",
  approved: "border-border/90 bg-card",
  assigned: "border-border/90 bg-card",
  in_progress: "border-border/90 bg-card",
  resolved: "border-success-border bg-success-surface",
  rejected: "border-destructive/30 bg-destructive/5",
});

const KANBAN_STATUSES = Object.freeze([...MAINTENANCE_FLOW, "rejected"]);

export const MAINTENANCE_KANBAN_COLUMNS = Object.freeze(
  KANBAN_STATUSES.map((value) => ({
    value,
    label: STATUS_CONFIG.maintenance[value].label,
    cardClassName: COLUMN_CARD_CLASSES[value],
  })),
);

export const MAINTENANCE_KANBAN_STATUSES = Object.freeze([
  "all",
  ...MAINTENANCE_KANBAN_COLUMNS.map((column) => column.value),
]);

export function getVisibleMaintenanceColumns(status) {
  if (status === "all") {
    return MAINTENANCE_KANBAN_COLUMNS.filter((column) =>
      MAINTENANCE_FLOW.includes(column.value),
    );
  }

  return MAINTENANCE_KANBAN_COLUMNS.filter((column) => column.value === status);
}
