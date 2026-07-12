export const APP_ROLES = Object.freeze({
  ADMIN: "admin",
  ASSET_MANAGER: "asset_manager",
  DEPARTMENT_HEAD: "department_head",
  EMPLOYEE: "employee",
});

export const ROLES = Object.freeze({
  [APP_ROLES.ADMIN]: "Admin",
  [APP_ROLES.ASSET_MANAGER]: "Asset Manager",
  [APP_ROLES.DEPARTMENT_HEAD]: "Department Head",
  [APP_ROLES.EMPLOYEE]: "Employee",
});

export const MANAGER_ROLES = Object.freeze([
  APP_ROLES.ADMIN,
  APP_ROLES.ASSET_MANAGER,
]);

export const ASSET_STATUS = Object.freeze({
  available: { label: "Available", color: "available" },
  allocated: { label: "Allocated", color: "allocated" },
  reserved: { label: "Reserved", color: "reserved" },
  under_maintenance: {
    label: "Under Maintenance",
    color: "maintenance",
  },
  lost: { label: "Lost", color: "lost" },
  retired: { label: "Retired", color: "retired" },
  disposed: { label: "Disposed", color: "disposed" },
});

export const CONDITION = Object.freeze([
  "new",
  "good",
  "fair",
  "poor",
  "damaged",
]);

export const ALLOCATION_STATUS = Object.freeze(["active", "returned"]);
export const TRANSFER_STATUS = Object.freeze([
  "pending",
  "approved",
  "rejected",
]);

export const BOOKING_DISPLAY_STATUS = Object.freeze({
  upcoming: "booking-upcoming",
  ongoing: "booking-active",
  completed: "booking-complete",
  cancelled: "booking-cancelled",
});

export const MAINTENANCE_STATUS = Object.freeze([
  "pending",
  "approved",
  "rejected",
  "assigned",
  "in_progress",
  "resolved",
]);

export const MAINTENANCE_PRIORITY = Object.freeze({
  low: "priority-low",
  medium: "priority-medium",
  high: "priority-high",
  critical: "priority-critical",
});

export const AUDIT_RESULT = Object.freeze({
  pending: "audit-pending",
  verified: "audit-verified",
  missing: "audit-missing",
  damaged: "audit-damaged",
});

export const MANUAL_TRANSITIONS = Object.freeze({
  available: ["reserved", "lost", "retired", "disposed"],
  reserved: ["available"],
  lost: ["available"],
  retired: ["disposed"],
});

export const BADGE_CLASSES = Object.freeze({
  available:
    "border-asset-available-border bg-asset-available-surface text-asset-available",
  allocated:
    "border-asset-allocated-border bg-asset-allocated-surface text-asset-allocated",
  reserved:
    "border-asset-reserved-border bg-asset-reserved-surface text-asset-reserved",
  maintenance:
    "border-asset-maintenance-border bg-asset-maintenance-surface text-asset-maintenance",
  lost: "border-asset-lost-border bg-asset-lost-surface text-asset-lost",
  retired:
    "border-asset-retired-border bg-asset-retired-surface text-asset-retired",
  disposed:
    "border-asset-disposed-border bg-asset-disposed-surface text-asset-disposed",
  "state-active":
    "border-success-border bg-success-surface text-success",
  "state-inactive":
    "border-asset-retired-border bg-asset-retired-surface text-asset-retired",
  "state-pending":
    "border-asset-reserved-border bg-asset-reserved-surface text-asset-reserved",
  "state-approved":
    "border-success-border bg-success-surface text-success",
  "state-rejected":
    "border-asset-lost-border bg-asset-lost-surface text-asset-lost",
  "state-assigned":
    "border-asset-allocated-border bg-asset-allocated-surface text-asset-allocated",
  "state-in-progress":
    "border-asset-maintenance-border bg-asset-maintenance-surface text-asset-maintenance",
  "state-resolved":
    "border-success-border bg-success-surface text-success",
  "priority-low":
    "border-asset-retired-border bg-asset-retired-surface text-asset-retired",
  "priority-medium":
    "border-asset-allocated-border bg-asset-allocated-surface text-asset-allocated",
  "priority-high":
    "border-asset-maintenance-border bg-asset-maintenance-surface text-asset-maintenance",
  "priority-critical":
    "border-asset-lost-border bg-asset-lost-surface text-asset-lost",
  "booking-upcoming":
    "border-asset-allocated-border bg-asset-allocated-surface text-asset-allocated",
  "booking-active":
    "border-success-border bg-success-surface text-success",
  "booking-complete":
    "border-asset-retired-border bg-asset-retired-surface text-asset-retired",
  "booking-cancelled":
    "border-asset-lost-border bg-asset-lost-surface text-asset-lost",
  "audit-pending":
    "border-asset-retired-border bg-asset-retired-surface text-asset-retired",
  "audit-verified":
    "border-success-border bg-success-surface text-success",
  "audit-missing":
    "border-asset-lost-border bg-asset-lost-surface text-asset-lost",
  "audit-damaged":
    "border-asset-maintenance-border bg-asset-maintenance-surface text-asset-maintenance",
});

export const STATUS_CONFIG = Object.freeze({
  asset: ASSET_STATUS,
  entity: {
    active: { label: "Active", color: "state-active" },
    inactive: { label: "Inactive", color: "state-inactive" },
  },
  allocation: {
    active: { label: "Active", color: "state-active" },
    returned: { label: "Returned", color: "state-inactive" },
    overdue: { label: "Overdue", color: "state-rejected" },
    return_requested: { label: "Return requested", color: "state-pending" },
  },
  transfer: {
    pending: { label: "Pending", color: "state-pending" },
    approved: { label: "Approved", color: "state-approved" },
    rejected: { label: "Rejected", color: "state-rejected" },
  },
  booking: {
    upcoming: { label: "Upcoming", color: BOOKING_DISPLAY_STATUS.upcoming },
    ongoing: { label: "Ongoing", color: BOOKING_DISPLAY_STATUS.ongoing },
    completed: { label: "Completed", color: BOOKING_DISPLAY_STATUS.completed },
    cancelled: { label: "Cancelled", color: BOOKING_DISPLAY_STATUS.cancelled },
  },
  maintenance: {
    pending: { label: "Pending", color: "state-pending" },
    approved: { label: "Approved", color: "state-approved" },
    rejected: { label: "Rejected", color: "state-rejected" },
    assigned: { label: "Technician assigned", color: "state-assigned" },
    in_progress: { label: "In progress", color: "state-in-progress" },
    resolved: { label: "Resolved", color: "state-resolved" },
  },
  priority: Object.fromEntries(
    Object.entries(MAINTENANCE_PRIORITY).map(([value, color]) => [
      value,
      { label: value[0].toUpperCase() + value.slice(1), color },
    ]),
  ),
  audit: {
    pending: { label: "Pending", color: AUDIT_RESULT.pending },
    verified: { label: "Verified", color: AUDIT_RESULT.verified },
    missing: { label: "Missing", color: AUDIT_RESULT.missing },
    damaged: { label: "Damaged", color: AUDIT_RESULT.damaged },
  },
  auditCycle: {
    open: { label: "Open", color: "state-active" },
    closed: { label: "Closed", color: "state-inactive" },
  },
  role: Object.fromEntries(
    Object.entries(ROLES).map(([value, label]) => [
      value,
      {
        label,
        color: value === APP_ROLES.ADMIN ? "reserved" : "allocated",
      },
    ]),
  ),
  condition: Object.fromEntries(
    CONDITION.map((value) => [
      value,
      {
        label: value[0].toUpperCase() + value.slice(1),
        color: ["poor", "damaged"].includes(value)
          ? "maintenance"
          : "state-inactive",
      },
    ]),
  ),
});

export const MAINTENANCE_FLOW = Object.freeze([
  "pending",
  "approved",
  "assigned",
  "in_progress",
  "resolved",
]);

export const NOTIFICATION_TYPE_META = Object.freeze({
  asset_assigned: { label: "Asset", icon: "package" },
  booking_reminder: { label: "Booking", icon: "clock" },
  maintenance_approved: { label: "Maintenance", icon: "wrench" },
  transfer_requested: { label: "Transfer", icon: "transfer" },
  overdue_return: { label: "Overdue", icon: "alert" },
  audit_discrepancy: { label: "Audit", icon: "search" },
});

export const ENTITY_ROUTE_MAP = Object.freeze({
  asset: (id) => `/assets/${encodeURIComponent(id)}`,
  booking: () => "/bookings",
  maintenance: () => "/maintenance",
  transfer: () => "/allocations?tab=transfers",
  allocation: () => "/allocations",
  audit: (id) => `/audits/${encodeURIComponent(id)}`,
});

export const NAV_ITEMS = Object.freeze([
  {
    group: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: "dashboard" }],
  },
  {
    group: "Operations",
    items: [
      { to: "/assets", label: "Assets", icon: "assets" },
      {
        to: "/allocations",
        label: "Allocations & Transfers",
        icon: "allocations",
      },
      { to: "/bookings", label: "Resource Booking", icon: "bookings" },
      {
        to: "/maintenance",
        label: "Maintenance",
        icon: "maintenance",
      },
    ],
  },
  {
    group: "Governance",
    items: [
      {
        to: "/organization",
        label: "Organization",
        icon: "organization",
        roles: [APP_ROLES.ADMIN],
      },
      {
        to: "/audits",
        label: "Audits",
        icon: "audits",
        roles: MANAGER_ROLES,
        capability: "audits.view",
      },
      {
        to: "/reports",
        label: "Reports",
        icon: "reports",
        roles: [
          APP_ROLES.ADMIN,
          APP_ROLES.ASSET_MANAGER,
          APP_ROLES.DEPARTMENT_HEAD,
        ],
      },
      {
        to: "/activity",
        label: "Activity",
        icon: "activity",
        roles: [APP_ROLES.ADMIN],
      },
    ],
  },
]);

export const ROUTE_META = Object.freeze([
  { pattern: "/", title: "Dashboard", section: "Overview" },
  { pattern: "/organization", title: "Organization", section: "Governance" },
  { pattern: "/assets/:id", title: "Asset passport", section: "Operations" },
  { pattern: "/assets", title: "Assets", section: "Operations" },
  {
    pattern: "/allocations",
    title: "Allocations & Transfers",
    section: "Operations",
  },
  { pattern: "/bookings", title: "Resource Booking", section: "Operations" },
  { pattern: "/maintenance", title: "Maintenance", section: "Operations" },
  { pattern: "/audits/:id", title: "Audit cycle", section: "Governance" },
  { pattern: "/audits", title: "Audits", section: "Governance" },
  { pattern: "/reports", title: "Reports", section: "Governance" },
  {
    pattern: "/notifications",
    title: "Notifications",
    section: "Account",
  },
  { pattern: "/activity", title: "Activity", section: "Governance" },
]);
