import { ApiError } from "@/api/client";
import { fixtureActor, matchesFixtureIdentity } from "@/api/__fixtures__/session";
import {
  fixtureDb,
  fixtureEnvelope,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
} from "@/api/__fixtures__/store";

const NEXT_ACTIONS = Object.freeze({
  pending: ["approve", "reject"],
  approved: ["assign"],
  assigned: ["start"],
  in_progress: ["resolve"],
  rejected: [],
  resolved: [],
});

function maintenanceById(id) {
  const request = fixtureDb.maintenance.find((row) => row.id === id);
  if (!request) {
    throw new ApiError({ code: "NOT_FOUND", message: "Maintenance request not found.", status: 404 });
  }
  return request;
}

function requireAction(request, action) {
  if (!(request.allowed_actions ?? NEXT_ACTIONS[request.status] ?? []).includes(action)) {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This request has already moved to another workflow step.",
      status: 409,
      details: { current_status: request.status },
    });
  }
}

function advance(request, status, fields = {}) {
  Object.assign(request, fields, {
    status,
    allowed_actions: NEXT_ACTIONS[status],
    updated_at: new Date().toISOString(),
  });
  return fixtureResult(fixtureEnvelope(request));
}

export async function fixtureListMaintenance(params = {}) {
  let rows = [...fixtureDb.maintenance];
  const search = String(params.search ?? "").trim().toLowerCase();
  if (params.status) rows = rows.filter((row) => row.status === params.status);
  if (params.priority) rows = rows.filter((row) => row.priority === params.priority);
  if (params.asset_id) rows = rows.filter((row) => row.asset.id === params.asset_id);
  if (params.mine === true || params.mine === "true") {
    rows = rows.filter((row) => matchesFixtureIdentity(row.raised_by));
  }
  if (search) {
    rows = rows.filter((row) =>
      [row.title, row.asset.asset_tag, row.asset.name, row.technician_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }
  rows.sort((left, right) => new Date(right.updated_at) - new Date(left.updated_at));
  return fixtureResult(paginateFixture(rows, params));
}

export async function fixtureGetMaintenance(id) {
  return fixtureResult(fixtureEnvelope(maintenanceById(id)));
}

export async function fixtureCreateMaintenance(payload) {
  const asset = fixtureDb.assets.find((row) => row.id === payload.asset_id);
  if (!asset || ["retired", "disposed"].includes(asset.status)) {
    throw new ApiError({
      code: "ASSET_UNAVAILABLE",
      message: "Maintenance cannot be raised for this asset.",
      status: 409,
    });
  }
  const duplicate = fixtureDb.maintenance.find(
    (row) => row.asset.id === asset.id && !["rejected", "resolved"].includes(row.status),
  );
  if (duplicate) {
    throw new ApiError({
      code: "MAINTENANCE_ALREADY_OPEN",
      message: "This asset already has an active maintenance request.",
      status: 409,
      details: { maintenance_id: duplicate.id },
    });
  }
  const timestamp = new Date().toISOString();
  const request = {
    id: nextFixtureId("maintenance"),
    asset: { id: asset.id, asset_tag: asset.asset_tag, name: asset.name },
    title: payload.title,
    description: payload.description || null,
    priority: payload.priority,
    status: "pending",
    raised_by: fixtureActor(),
    technician_name: null,
    photo_url: payload.photo_url || null,
    created_at: timestamp,
    updated_at: timestamp,
    allowed_actions: NEXT_ACTIONS.pending,
  };
  fixtureDb.maintenance.push(request);
  asset.open_maintenance_count = (asset.open_maintenance_count ?? 0) + 1;
  return fixtureResult(fixtureEnvelope(request));
}

export async function fixtureApproveMaintenance(id) {
  const request = maintenanceById(id);
  requireAction(request, "approve");
  const asset = fixtureDb.assets.find((row) => row.id === request.asset.id);
  if (asset) {
    request.previous_asset_status = asset.status;
    asset.status = "under_maintenance";
    asset.updated_at = new Date().toISOString();
  }
  return advance(request, "approved", { approved_at: new Date().toISOString() });
}

export async function fixtureRejectMaintenance(id, payload) {
  const request = maintenanceById(id);
  requireAction(request, "reject");
  const asset = fixtureDb.assets.find((row) => row.id === request.asset.id);
  if (asset) {
    asset.open_maintenance_count = Math.max(0, (asset.open_maintenance_count ?? 1) - 1);
    if (asset.status === "under_maintenance") {
      asset.status = asset.current_holder ? "allocated" : "available";
      asset.updated_at = new Date().toISOString();
    }
  }
  return advance(request, "rejected", {
    rejection_reason: payload.reason,
    rejected_at: new Date().toISOString(),
  });
}

export async function fixtureAssignMaintenance(id, payload) {
  const request = maintenanceById(id);
  requireAction(request, "assign");
  return advance(request, "assigned", {
    technician_name: payload.technician_name,
    assigned_at: new Date().toISOString(),
  });
}

export async function fixtureStartMaintenance(id) {
  const request = maintenanceById(id);
  requireAction(request, "start");
  return advance(request, "in_progress", { started_at: new Date().toISOString() });
}

export async function fixtureResolveMaintenance(id, payload) {
  const request = maintenanceById(id);
  requireAction(request, "resolve");
  const asset = fixtureDb.assets.find((row) => row.id === request.asset.id);
  const assetStatus = asset?.current_holder ? "allocated" : "available";
  if (asset) {
    asset.status = assetStatus;
    asset.open_maintenance_count = Math.max(0, (asset.open_maintenance_count ?? 1) - 1);
    asset.updated_at = new Date().toISOString();
  }
  await advance(request, "resolved", {
    resolution_notes: payload.resolution_notes || null,
    cost: payload.cost || null,
    resolved_at: new Date().toISOString(),
  });
  return fixtureResult(fixtureEnvelope({ ...request, asset_status: assetStatus }), 0);
}
