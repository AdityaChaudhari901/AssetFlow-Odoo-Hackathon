import { ApiError } from "@/api/client";
import {
  fixtureActor,
  getFixtureIdentity,
  matchesFixtureIdentity,
} from "@/api/__fixtures__/session";
import {
  fixtureDb,
  fixtureEnvelope,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
  refreshFixtureCustodyCounts,
} from "@/api/__fixtures__/store";

function targetFromPayload(payload) {
  if (payload.to_employee_id) {
    const employee = fixtureDb.employees.find((item) => item.id === payload.to_employee_id);
    return employee
      ? { type: "employee", id: employee.id, name: employee.full_name }
      : null;
  }

  const department = fixtureDb.departments.find(
    (item) => item.id === payload.to_department_id,
  );
  return department
    ? { type: "department", id: department.id, name: department.name }
    : null;
}

function canReviewTransfers() {
  return ["admin", "asset_manager", "department_head"].includes(
    getFixtureIdentity().role,
  );
}

function allowedTransferActions(transfer) {
  return transfer.status === "pending" && canReviewTransfers()
    ? ["approve", "reject"]
    : [];
}

function assertTransferReviewer() {
  if (!canReviewTransfers()) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "You cannot review this transfer request.",
      status: 403,
    });
  }
}

export async function fixtureListTransfers(params = {}) {
  let rows = fixtureDb.transfers;
  if (getFixtureIdentity().role === "employee") {
    rows = rows.filter(
      (row) =>
        matchesFixtureIdentity(row.requested_by) ||
        matchesFixtureIdentity(row.from_holder) ||
        matchesFixtureIdentity(row.to_target),
    );
  }
  if (params.status) rows = rows.filter((row) => row.status === params.status);
  if (params.asset_id) rows = rows.filter((row) => row.asset.id === params.asset_id);
  if (params.mine === true || params.mine === "true") {
    rows = rows.filter(
      (row) =>
        matchesFixtureIdentity(row.requested_by) ||
        matchesFixtureIdentity(row.from_holder) ||
        matchesFixtureIdentity(row.to_target),
    );
  }
  const page = paginateFixture(rows, params);
  return fixtureResult({
    ...page,
    data: page.data.map((row) => ({
      ...row,
      allowed_actions: allowedTransferActions(row),
    })),
  });
}

export async function fixtureCreateTransfer(payload) {
  const allocation = fixtureDb.allocations.find(
    (row) => row.asset.id === payload.asset_id && row.status === "active",
  );
  if (!allocation) {
    throw new ApiError({
      code: "ASSET_NOT_ALLOCATED",
      message: "This asset is not currently allocated.",
      status: 409,
    });
  }

  const duplicate = fixtureDb.transfers.some(
    (row) => row.asset.id === payload.asset_id && row.status === "pending",
  );
  if (duplicate) {
    throw new ApiError({
      code: "DUPLICATE_RESOURCE",
      message: "A transfer request for this asset is already pending.",
      status: 409,
    });
  }

  const target = targetFromPayload(payload);
  if (!target) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Choose a valid transfer target.",
      status: 422,
    });
  }

  const transfer = {
    id: nextFixtureId("transfer"),
    asset: allocation.asset,
    from_holder: {
      type: allocation.holder_type,
      id: allocation.holder.id,
      name: allocation.holder.name,
    },
    to_target: target,
    requested_by: fixtureActor(),
    reason: payload.reason || null,
    status: "pending",
    created_at: new Date().toISOString(),
    allowed_actions: [],
  };
  transfer.allowed_actions = allowedTransferActions(transfer);
  fixtureDb.transfers.unshift(transfer);
  return fixtureResult(fixtureEnvelope(transfer));
}

export async function fixtureApproveTransfer(id) {
  assertTransferReviewer();
  const transfer = fixtureDb.transfers.find((row) => row.id === id);
  if (!transfer || transfer.status !== "pending") {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This transfer request was already processed.",
      status: 409,
    });
  }

  const allocation = fixtureDb.allocations.find(
    (row) => row.asset.id === transfer.asset.id && row.status === "active",
  );
  if (!allocation) {
    throw new ApiError({
      code: "ASSET_NOT_ALLOCATED",
      message: "The source allocation is no longer active.",
      status: 409,
    });
  }

  allocation.status = "returned";
  allocation.returned_at = new Date().toISOString();
  allocation.is_overdue = false;
  allocation.return_requested = false;
  allocation.allowed_actions = [];
  const newAllocation = {
    ...allocation,
    id: nextFixtureId("allocation"),
    holder_type: transfer.to_target.type,
    holder: { id: transfer.to_target.id, name: transfer.to_target.name },
    allocated_at: new Date().toISOString(),
    returned_at: null,
    status: "active",
    return_requested: false,
    is_overdue: false,
    days_overdue: 0,
    allowed_actions: [],
  };
  newAllocation.allowed_actions = [];
  fixtureDb.allocations.unshift(newAllocation);
  refreshFixtureCustodyCounts();
  transfer.status = "approved";
  transfer.approved_at = new Date().toISOString();
  transfer.allowed_actions = [];

  const asset = fixtureDb.assets.find((item) => item.id === transfer.asset.id);
  if (asset) {
    asset.status = "allocated";
    asset.current_holder = {
      type: transfer.to_target.type,
      id: transfer.to_target.id,
      name: transfer.to_target.name,
    };
    asset.updated_at = new Date().toISOString();
  }

  return fixtureResult(fixtureEnvelope({ transfer, new_allocation: newAllocation }));
}

export async function fixtureRejectTransfer(id, payload = {}) {
  assertTransferReviewer();
  const transfer = fixtureDb.transfers.find((row) => row.id === id);
  if (!transfer || transfer.status !== "pending") {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This transfer request was already processed.",
      status: 409,
    });
  }
  transfer.status = "rejected";
  transfer.rejection_reason = payload.reason || null;
  transfer.rejected_at = new Date().toISOString();
  transfer.allowed_actions = [];
  return fixtureResult(fixtureEnvelope(transfer));
}
