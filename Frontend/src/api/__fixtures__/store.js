const now = new Date();
let fixtureSequence = 100;

function localDate(dayOffset = 0, hour = 9, minute = 0) {
  const date = new Date(now);
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function iso(dayOffset = 0, hour = 9, minute = 0) {
  return localDate(dayOffset, hour, minute).toISOString();
}

function dateOnly(dayOffset = 0) {
  const date = localDate(dayOffset, 12, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const departments = [
  {
    id: "dep-engineering",
    name: "Engineering",
    description: "Product engineering and internal technology operations.",
    head: { id: "emp-rohan", full_name: "Rohan Mehta" },
    parent_department_id: null,
    employee_count: 18,
    asset_count: 42,
    status: "active",
    created_at: iso(-180),
    updated_at: iso(-2),
  },
  {
    id: "dep-facilities",
    name: "Facilities",
    description: "Workplace, fleet, and shared infrastructure.",
    head: { id: "emp-arjun", full_name: "Arjun Nair" },
    parent_department_id: null,
    employee_count: 9,
    asset_count: 31,
    status: "active",
    created_at: iso(-170),
    updated_at: iso(-4),
  },
  {
    id: "dep-field-ops",
    name: "Field Operations",
    description: "Regional operations and customer-site equipment.",
    head: { id: "emp-sana", full_name: "Sana Iqbal" },
    parent_department_id: "dep-facilities",
    employee_count: 12,
    asset_count: 27,
    status: "active",
    created_at: iso(-150),
    updated_at: iso(-6),
  },
  {
    id: "dep-archive",
    name: "Legacy Procurement",
    description: "Archived department retained for historical records.",
    head: null,
    parent_department_id: null,
    employee_count: 0,
    asset_count: 4,
    status: "inactive",
    created_at: iso(-320),
    updated_at: iso(-90),
  },
];

const categories = [
  {
    id: "cat-electronics",
    name: "Electronics",
    description: "Computers, displays, projectors, and office electronics.",
    custom_fields: [
      { key: "warranty_expiry", label: "Warranty expiry", type: "date", required: false },
      { key: "power_rating", label: "Power rating (W)", type: "number", required: false },
    ],
    status: "active",
    created_at: iso(-160),
    updated_at: iso(-3),
  },
  {
    id: "cat-furniture",
    name: "Furniture",
    description: "Desks, chairs, storage, and workplace fittings.",
    custom_fields: [
      { key: "material", label: "Material", type: "text", required: false },
      { key: "ergonomic", label: "Ergonomic", type: "boolean", required: false },
    ],
    status: "active",
    created_at: iso(-155),
    updated_at: iso(-8),
  },
  {
    id: "cat-spaces",
    name: "Rooms & Spaces",
    description: "Bookable meeting and collaboration spaces.",
    custom_fields: [
      { key: "capacity", label: "Capacity", type: "number", required: true },
      { key: "video_conferencing", label: "Video conferencing", type: "boolean", required: false },
    ],
    status: "active",
    created_at: iso(-140),
    updated_at: iso(-5),
  },
  {
    id: "cat-vehicles",
    name: "Vehicles",
    description: "Shared transport and field-service vehicles.",
    custom_fields: [
      { key: "registration_number", label: "Registration number", type: "text", required: true },
      { key: "next_service", label: "Next service", type: "date", required: false },
    ],
    status: "active",
    created_at: iso(-130),
    updated_at: iso(-7),
  },
];

const employees = [
  {
    id: "emp-aditya",
    full_name: "Aditya Chaudhari",
    email: "aditya@assetflow.demo",
    role: "admin",
    capabilities: ["audits.view"],
    organization_name: "AssetFlow Demo",
    department_id: "dep-engineering",
    department_name: "Engineering",
    status: "active",
    avatar_url: null,
    active_allocations: 0,
    created_at: iso(-220),
  },
  {
    id: "emp-arjun",
    full_name: "Arjun Nair",
    email: "arjun@assetflow.demo",
    role: "asset_manager",
    capabilities: ["audits.view"],
    organization_name: "AssetFlow Demo",
    department_id: "dep-facilities",
    department_name: "Facilities",
    status: "active",
    avatar_url: null,
    active_allocations: 1,
    created_at: iso(-210),
  },
  {
    id: "emp-rohan",
    full_name: "Rohan Mehta",
    email: "rohan@assetflow.demo",
    role: "department_head",
    capabilities: ["audits.view"],
    organization_name: "AssetFlow Demo",
    department_id: "dep-engineering",
    department_name: "Engineering",
    status: "active",
    avatar_url: null,
    active_allocations: 1,
    created_at: iso(-190),
  },
  {
    id: "emp-priya",
    full_name: "Priya Shah",
    email: "priya@assetflow.demo",
    role: "employee",
    capabilities: [],
    organization_name: "AssetFlow Demo",
    department_id: "dep-engineering",
    department_name: "Engineering",
    status: "active",
    avatar_url: null,
    active_allocations: 1,
    created_at: iso(-120),
  },
  {
    id: "emp-sana",
    full_name: "Sana Iqbal",
    email: "sana@assetflow.demo",
    role: "employee",
    capabilities: ["audits.view"],
    organization_name: "AssetFlow Demo",
    department_id: "dep-field-ops",
    department_name: "Field Operations",
    status: "active",
    avatar_url: null,
    active_allocations: 0,
    created_at: iso(-110),
  },
  {
    id: "emp-vikram",
    full_name: "Vikram Rao",
    email: "vikram@assetflow.demo",
    role: "employee",
    capabilities: [],
    organization_name: "AssetFlow Demo",
    department_id: "dep-archive",
    department_name: "Legacy Procurement",
    status: "inactive",
    avatar_url: null,
    active_allocations: 0,
    created_at: iso(-260),
  },
];

const assets = [
  {
    id: "asset-laptop-0014",
    asset_tag: "AF-0014",
    name: "Dell Latitude Laptop",
    serial_number: "DL-7440-0014",
    image_url: null,
    category: { id: "cat-electronics", name: "Electronics" },
    department: { id: "dep-engineering", name: "Engineering" },
    status: "allocated",
    condition: "good",
    location: "Engineering · Desk E12",
    is_bookable: false,
    current_holder: { type: "employee", id: "emp-priya", name: "Priya Shah" },
    acquisition_date: dateOnly(-920),
    acquisition_cost: "86000",
    custom_field_values: { warranty_expiry: dateOnly(180), power_rating: 65 },
    open_maintenance_count: 0,
    created_at: iso(-920),
    updated_at: iso(-1),
  },
  {
    id: "asset-projector-0062",
    asset_tag: "AF-0062",
    name: "Epson Laser Projector",
    serial_number: "EP-LS-0062",
    image_url: null,
    category: { id: "cat-electronics", name: "Electronics" },
    department: { id: "dep-facilities", name: "Facilities" },
    status: "available",
    condition: "fair",
    location: "HQ · Floor 2",
    is_bookable: true,
    current_holder: null,
    acquisition_date: dateOnly(-1330),
    acquisition_cost: "145000",
    custom_field_values: { warranty_expiry: dateOnly(-40), power_rating: 310 },
    open_maintenance_count: 1,
    created_at: iso(-1330),
    updated_at: iso(-1),
  },
  {
    id: "asset-chair-0201",
    asset_tag: "AF-0201",
    name: "Ergonomic Office Chair",
    serial_number: null,
    image_url: null,
    category: { id: "cat-furniture", name: "Furniture" },
    department: null,
    status: "under_maintenance",
    condition: "good",
    location: "Central Warehouse",
    is_bookable: false,
    current_holder: null,
    acquisition_date: dateOnly(-460),
    acquisition_cost: "18000",
    custom_field_values: { material: "Mesh", ergonomic: true },
    open_maintenance_count: 1,
    created_at: iso(-460),
    updated_at: iso(-6),
  },
  {
    id: "asset-room-b2",
    asset_tag: "AF-0301",
    name: "Conference Room B2",
    serial_number: null,
    image_url: null,
    category: { id: "cat-spaces", name: "Rooms & Spaces" },
    department: { id: "dep-facilities", name: "Facilities" },
    status: "available",
    condition: "good",
    location: "HQ · Floor 2",
    is_bookable: true,
    current_holder: null,
    acquisition_date: dateOnly(-700),
    acquisition_cost: "0",
    custom_field_values: { capacity: 12, video_conferencing: true },
    open_maintenance_count: 0,
    created_at: iso(-700),
    updated_at: iso(-1),
  },
  {
    id: "asset-van-3433",
    asset_tag: "AF-3433",
    name: "Field Service Van",
    serial_number: "MH12-AF-3433",
    image_url: null,
    category: { id: "cat-vehicles", name: "Vehicles" },
    department: { id: "dep-field-ops", name: "Field Operations" },
    status: "available",
    condition: "good",
    location: "East Depot",
    is_bookable: true,
    current_holder: null,
    acquisition_date: dateOnly(-1080),
    acquisition_cost: "1250000",
    custom_field_values: { registration_number: "MH12-AF-3433", next_service: dateOnly(24) },
    open_maintenance_count: 0,
    created_at: iso(-1080),
    updated_at: iso(-2),
  },
  {
    id: "asset-forklift-0078",
    asset_tag: "AF-0078",
    name: "Warehouse Forklift",
    serial_number: "FL-0078",
    image_url: null,
    category: { id: "cat-vehicles", name: "Vehicles" },
    department: { id: "dep-facilities", name: "Facilities" },
    status: "under_maintenance",
    condition: "fair",
    location: "Central Warehouse",
    is_bookable: false,
    current_holder: { type: "department", id: "dep-facilities", name: "Facilities" },
    acquisition_date: dateOnly(-1810),
    acquisition_cost: "780000",
    custom_field_values: { registration_number: "WH-FL-0078", next_service: dateOnly(5) },
    open_maintenance_count: 1,
    created_at: iso(-1810),
    updated_at: iso(-3),
  },
  {
    id: "asset-camera-0301",
    asset_tag: "AF-0301-C",
    name: "Sony Field Camera",
    serial_number: "SNY-0301",
    image_url: null,
    category: { id: "cat-electronics", name: "Electronics" },
    department: { id: "dep-field-ops", name: "Field Operations" },
    status: "retired",
    condition: "poor",
    location: "East Depot",
    is_bookable: false,
    current_holder: null,
    acquisition_date: dateOnly(-2300),
    acquisition_cost: "92000",
    custom_field_values: { warranty_expiry: dateOnly(-1500), power_rating: 18 },
    open_maintenance_count: 0,
    created_at: iso(-2300),
    updated_at: iso(-40),
  },
];

const allocations = [
  {
    id: "allocation-laptop-priya",
    asset: { id: "asset-laptop-0014", asset_tag: "AF-0014", name: "Dell Latitude Laptop" },
    holder_type: "employee",
    holder: { id: "emp-priya", name: "Priya Shah", department_name: "Engineering" },
    allocated_at: iso(-122),
    expected_return_date: dateOnly(-3),
    returned_at: null,
    status: "active",
    is_overdue: true,
    days_overdue: 3,
    return_requested: false,
    notes: "Primary engineering workstation.",
    allowed_actions: ["request_return", "check_in", "request_transfer"],
  },
  {
    id: "allocation-forklift-facilities",
    asset: { id: "asset-forklift-0078", asset_tag: "AF-0078", name: "Warehouse Forklift" },
    holder_type: "department",
    holder: { id: "dep-facilities", name: "Facilities" },
    allocated_at: iso(-60),
    expected_return_date: dateOnly(6),
    returned_at: null,
    status: "active",
    is_overdue: false,
    days_overdue: 0,
    return_requested: true,
    notes: "Warehouse operations pool.",
    allowed_actions: ["check_in", "request_transfer"],
  },
  {
    id: "allocation-chair-returned",
    asset: { id: "asset-chair-0201", asset_tag: "AF-0201", name: "Ergonomic Office Chair" },
    holder_type: "employee",
    holder: { id: "emp-arjun", name: "Arjun Nair", department_name: "Facilities" },
    allocated_at: iso(-240),
    expected_return_date: dateOnly(-180),
    returned_at: iso(-175),
    status: "returned",
    is_overdue: false,
    days_overdue: 0,
    return_requested: false,
    notes: "Returned in good condition.",
    allowed_actions: [],
  },
];

const transfers = [
  {
    id: "transfer-laptop-sana",
    asset: { id: "asset-laptop-0014", asset_tag: "AF-0014", name: "Dell Latitude Laptop" },
    from_holder: { type: "employee", id: "emp-priya", name: "Priya Shah" },
    to_target: { type: "employee", id: "emp-sana", name: "Sana Iqbal" },
    requested_by: { id: "emp-priya", full_name: "Priya Shah" },
    reason: "Temporary field deployment for the East operations team.",
    status: "pending",
    created_at: iso(-1, 11, 30),
    allowed_actions: ["approve", "reject"],
  },
];

const bookings = [
  {
    id: "booking-room-upcoming",
    asset: { id: "asset-room-b2", asset_tag: "AF-0301", name: "Conference Room B2" },
    booked_by: { id: "emp-priya", full_name: "Priya Shah" },
    start_time: iso(1, 9, 0),
    end_time: iso(1, 10, 0),
    purpose: "Procurement weekly sync",
    department_id: "dep-engineering",
    display_status: "upcoming",
    is_mine: false,
  },
  {
    id: "booking-room-own",
    asset: { id: "asset-room-b2", asset_tag: "AF-0301", name: "Conference Room B2" },
    booked_by: { id: "emp-aditya", full_name: "Aditya Chaudhari" },
    start_time: iso(2, 14, 0),
    end_time: iso(2, 15, 30),
    purpose: "AssetFlow demo rehearsal",
    department_id: "dep-engineering",
    display_status: "upcoming",
    is_mine: true,
  },
  {
    id: "booking-room-completed",
    asset: { id: "asset-room-b2", asset_tag: "AF-0301", name: "Conference Room B2" },
    booked_by: { id: "emp-rohan", full_name: "Rohan Mehta" },
    start_time: iso(-1, 11, 0),
    end_time: iso(-1, 12, 0),
    purpose: "Engineering planning",
    department_id: "dep-engineering",
    display_status: "completed",
    is_mine: false,
  },
  {
    id: "booking-van-upcoming",
    asset: { id: "asset-van-3433", asset_tag: "AF-3433", name: "Field Service Van" },
    booked_by: { id: "emp-aditya", full_name: "Aditya Chaudhari" },
    start_time: iso(3, 8, 0),
    end_time: iso(3, 12, 0),
    purpose: "East depot inspection",
    department_id: "dep-field-ops",
    display_status: "upcoming",
    is_mine: true,
  },
];

const maintenance = [
  {
    id: "maintenance-projector",
    asset: { id: "asset-projector-0062", asset_tag: "AF-0062", name: "Epson Laser Projector" },
    title: "Projector lamp does not turn on",
    description: "Power is available but the projection unit remains dark.",
    priority: "high",
    status: "pending",
    raised_by: { id: "emp-priya", full_name: "Priya Shah" },
    technician_name: null,
    photo_url: null,
    created_at: iso(-1, 10, 15),
    updated_at: iso(-1, 10, 15),
    allowed_actions: ["approve", "reject"],
  },
  {
    id: "maintenance-ac-unit",
    asset: { id: "asset-chair-0201", asset_tag: "AF-0201", name: "Ergonomic Office Chair" },
    title: "Chair lift cylinder loses pressure",
    description: "Seat height drops gradually during normal use.",
    priority: "medium",
    status: "approved",
    raised_by: { id: "emp-rohan", full_name: "Rohan Mehta" },
    technician_name: null,
    photo_url: null,
    created_at: iso(-3, 9, 0),
    updated_at: iso(-2, 14, 0),
    allowed_actions: ["assign"],
  },
  {
    id: "maintenance-forklift",
    asset: { id: "asset-forklift-0078", asset_tag: "AF-0078", name: "Warehouse Forklift" },
    title: "Hydraulic pressure inspection",
    description: "Pressure drops after extended operation.",
    priority: "critical",
    status: "assigned",
    raised_by: { id: "emp-arjun", full_name: "Arjun Nair" },
    technician_name: "R. Varma",
    photo_url: null,
    created_at: iso(-5, 12, 0),
    updated_at: iso(-2, 8, 30),
    allowed_actions: ["start"],
  },
  {
    id: "maintenance-chair",
    asset: { id: "asset-chair-0201", asset_tag: "AF-0201", name: "Ergonomic Office Chair" },
    title: "Armrest replacement",
    description: "Replacement part installed and verified.",
    priority: "low",
    status: "resolved",
    raised_by: { id: "emp-sana", full_name: "Sana Iqbal" },
    technician_name: "R. Varma",
    resolution_notes: "Replaced armrest assembly.",
    cost: "2400",
    photo_url: null,
    created_at: iso(-18, 10, 0),
    updated_at: iso(-12, 16, 0),
    allowed_actions: [],
  },
];

const auditRecords = [
  {
    id: "audit-record-laptop",
    asset: { id: "asset-laptop-0014", asset_tag: "AF-0014", name: "Dell Latitude Laptop", location: "Engineering · Desk E12" },
    result: "verified",
    notes: "Asset and serial verified.",
    audited_by: { id: "emp-sana", full_name: "Sana Iqbal" },
    audited_at: iso(-1, 11, 0),
  },
  {
    id: "audit-record-projector",
    asset: { id: "asset-projector-0062", asset_tag: "AF-0062", name: "Epson Laser Projector", location: "HQ · Floor 2" },
    result: "damaged",
    notes: "Damage confirmed; service request is awaiting approval.",
    audited_by: { id: "emp-sana", full_name: "Sana Iqbal" },
    audited_at: iso(-1, 11, 20),
  },
  {
    id: "audit-record-chair",
    asset: { id: "asset-chair-0201", asset_tag: "AF-0201", name: "Ergonomic Office Chair", location: "Central Warehouse" },
    result: "missing",
    notes: "Not found at expected warehouse bay.",
    audited_by: { id: "emp-sana", full_name: "Sana Iqbal" },
    audited_at: iso(-1, 11, 35),
  },
  {
    id: "audit-record-room",
    asset: { id: "asset-room-b2", asset_tag: "AF-0301", name: "Conference Room B2", location: "HQ · Floor 2" },
    result: "pending",
    notes: null,
    audited_by: null,
    audited_at: null,
  },
];

const closedAuditRecords = Array.from({ length: 68 }, (_, index) => {
  const result = index < 65 ? "verified" : index < 67 ? "missing" : "damaged";
  const sequence = String(index + 1).padStart(3, "0");

  return {
    id: `audit-record-hq-${sequence}`,
    asset: {
      id: `historical-hq-asset-${sequence}`,
      asset_tag: `HQ-${sequence}`,
      name: `HQ inventory asset ${sequence}`,
      location: `HQ · Verification bay ${1 + (index % 8)}`,
    },
    result,
    notes:
      result === "verified"
        ? "Identity and location verified during the annual count."
        : result === "missing"
          ? "Asset was not found at its expected location."
          : "Physical damage recorded during the count.",
    audited_by: { id: "emp-rohan", full_name: "Rohan Mehta" },
    audited_at: iso(-74, 10 + (index % 6), index % 60),
  };
});

const audits = [
  {
    id: "audit-q3-engineering",
    name: "Q3 Engineering Asset Verification",
    department: { id: "dep-engineering", name: "Engineering" },
    location: null,
    scope_label: "Engineering department",
    start_date: dateOnly(-2),
    end_date: dateOnly(5),
    status: "open",
    auditors: [employees.find((employee) => employee.id === "emp-sana")],
    progress: { total: 4, verified: 1, missing: 1, damaged: 1, pending: 1 },
    records: auditRecords,
    is_assigned_auditor: true,
    created_at: iso(-4),
  },
  {
    id: "audit-hq-closed",
    name: "HQ Annual Asset Count",
    department: null,
    location: "HQ",
    scope_label: "HQ location",
    start_date: dateOnly(-80),
    end_date: dateOnly(-72),
    status: "closed",
    auditors: [employees.find((employee) => employee.id === "emp-rohan")],
    progress: { total: 68, verified: 65, missing: 2, damaged: 1, pending: 0 },
    records: closedAuditRecords,
    is_assigned_auditor: false,
    created_at: iso(-90),
    closed_at: iso(-71),
  },
];

const notifications = [
  {
    id: "notification-allocation",
    type: "asset_assigned",
    title: "Asset assigned",
    message: "Laptop AF-0014 was assigned to Priya Shah.",
    entity_type: "asset",
    entity_id: "asset-laptop-0014",
    is_read: false,
    created_at: iso(0, 12, 20),
  },
  {
    id: "notification-maintenance",
    type: "maintenance_approved",
    title: "Maintenance approved",
    message: "Maintenance request AF-0062 is ready for technician assignment.",
    entity_type: "maintenance",
    entity_id: "maintenance-projector",
    is_read: false,
    created_at: iso(0, 10, 5),
  },
  {
    id: "notification-booking",
    type: "booking_reminder",
    title: "Booking confirmed",
    message: "Conference Room B2 is booked tomorrow at 9:00 AM.",
    entity_type: "booking",
    entity_id: "booking-room-upcoming",
    is_read: false,
    created_at: iso(-1, 16, 0),
  },
  {
    id: "notification-transfer",
    type: "transfer_requested",
    title: "Transfer requires approval",
    message: "AF-0014 has a pending transfer request.",
    entity_type: "transfer",
    entity_id: "transfer-laptop-sana",
    is_read: true,
    created_at: iso(-1, 12, 0),
  },
  {
    id: "notification-overdue",
    type: "overdue_return",
    title: "Return overdue",
    message: "AF-0014 was due 3 days ago.",
    entity_type: "allocation",
    entity_id: "allocation-laptop-priya",
    is_read: true,
    created_at: iso(-2, 9, 0),
  },
  {
    id: "notification-audit",
    type: "audit_discrepancy",
    title: "Audit discrepancy recorded",
    message: "Two assets need attention in Q3 Engineering Asset Verification.",
    entity_type: "audit",
    entity_id: "audit-q3-engineering",
    is_read: false,
    created_at: iso(-2, 8, 30),
  },
];

const activityLogs = [
  {
    id: "activity-allocation",
    actor: { id: "emp-arjun", full_name: "Arjun Nair" },
    action: "allocation.created",
    entity_type: "asset",
    entity_id: "asset-laptop-0014",
    entity_label: "AF-0014 · Dell Latitude Laptop",
    details: { holder: "Priya Shah", department: "Engineering", request_id: "req-af-1021" },
    request_id: "req-af-1021",
    created_at: iso(0, 12, 20),
  },
  {
    id: "activity-maintenance",
    actor: { id: "emp-aditya", full_name: "Aditya Chaudhari" },
    action: "maintenance.approved",
    entity_type: "maintenance",
    entity_id: "maintenance-ac-unit",
    entity_label: "AF-0301 · Compressor noise",
    details: { previous_status: "pending", next_status: "approved", request_id: "req-af-1018" },
    request_id: "req-af-1018",
    created_at: iso(0, 10, 5),
  },
  {
    id: "activity-booking",
    actor: { id: "emp-priya", full_name: "Priya Shah" },
    action: "booking.created",
    entity_type: "booking",
    entity_id: "booking-room-upcoming",
    entity_label: "Conference Room B2",
    details: { start: iso(1, 9, 0), end: iso(1, 10, 0), request_id: "req-af-1012" },
    request_id: "req-af-1012",
    created_at: iso(-1, 16, 0),
  },
  {
    id: "activity-audit",
    actor: { id: "emp-sana", full_name: "Sana Iqbal" },
    action: "audit.discrepancy_recorded",
    entity_type: "audit",
    entity_id: "audit-q3-engineering",
    entity_label: "Q3 Engineering Asset Verification",
    details: { asset_tag: "AF-0201", result: "missing", request_id: "req-af-1008" },
    request_id: "req-af-1008",
    created_at: iso(-2, 8, 30),
  },
];

export const fixtureDb = {
  departments,
  categories,
  employees,
  assets,
  allocations,
  transfers,
  bookings,
  maintenance,
  audits,
  notifications,
  activityLogs,
};

export const fixtureReports = {
  utilization: [
    { asset: { id: "asset-room-b2", asset_tag: "AF-0301", name: "Conference Room B2" }, allocated_days: 68, utilization_pct: 82 },
    { asset: { id: "asset-van-3433", asset_tag: "AF-3433", name: "Field Service Van" }, allocated_days: 51, utilization_pct: 64 },
    { asset: { id: "asset-projector-0062", asset_tag: "AF-0062", name: "Epson Laser Projector" }, allocated_days: 37, utilization_pct: 48 },
    { asset: { id: "asset-chair-0201", asset_tag: "AF-0201", name: "Ergonomic Office Chair" }, allocated_days: 0, utilization_pct: 0 },
  ],
  maintenance: [
    { key: "asset-projector-0062", name: "Epson Laser Projector", request_count: 7, resolved_count: 5, total_cost: 28600 },
    { key: "asset-forklift-0078", name: "Warehouse Forklift", request_count: 5, resolved_count: 4, total_cost: 68400 },
    { key: "cat-electronics", name: "Electronics", request_count: 18, resolved_count: 15, total_cost: 112000 },
    { key: "cat-vehicles", name: "Vehicles", request_count: 9, resolved_count: 7, total_cost: 148000 },
  ],
  attention: [
    { asset: assets[1], reasons: ["Frequent maintenance", "Warranty expired"] },
    { asset: assets[5], reasons: ["Service due", "Condition fair"] },
    { asset: assets[6], reasons: ["Retirement candidate", "More than 6 years old"] },
  ],
  departments: [
    { department: { id: "dep-engineering", name: "Engineering" }, allocated_count: 38, total_acquisition_cost: 6840000 },
    { department: { id: "dep-facilities", name: "Facilities" }, allocated_count: 26, total_acquisition_cost: 9210000 },
    { department: { id: "dep-field-ops", name: "Field Operations" }, allocated_count: 19, total_acquisition_cost: 11400000 },
    { department: { id: "dep-archive", name: "Legacy Procurement" }, allocated_count: 0, total_acquisition_cost: 320000 },
  ],
  heatmap: Array.from({ length: 7 * 15 }, (_, index) => ({
    weekday: Math.floor(index / 15),
    hour: 7 + (index % 15),
    count: (index * 7 + Math.floor(index / 6)) % 9,
  })),
};

export function cloneFixture(value) {
  return structuredClone(value);
}

export function nextFixtureId(prefix) {
  fixtureSequence += 1;
  return `${prefix}-${fixtureSequence}`;
}

export function refreshFixtureCustodyCounts() {
  for (const employee of fixtureDb.employees) {
    employee.active_allocations = fixtureDb.allocations.filter(
      (allocation) =>
        allocation.status === "active" &&
        allocation.holder_type === "employee" &&
        allocation.holder.id === employee.id,
    ).length;
  }
}

export function fixtureEnvelope(data, meta) {
  const envelope = { data: cloneFixture(data) };
  return meta ? { ...envelope, meta: cloneFixture(meta) } : envelope;
}

export async function fixtureResult(value, delay = 90) {
  await new Promise((resolve) => window.setTimeout(resolve, delay));
  return cloneFixture(value);
}

export function paginateFixture(rows, params = {}) {
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    meta: { page, limit, total: rows.length },
  };
}

export function fixtureDate(dayOffset = 0) {
  return dateOnly(dayOffset);
}

export function fixtureIso(dayOffset = 0, hour = 9, minute = 0) {
  return iso(dayOffset, hour, minute);
}
