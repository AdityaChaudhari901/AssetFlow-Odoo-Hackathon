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
