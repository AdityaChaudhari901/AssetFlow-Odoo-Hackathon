import { ApiError } from "@/api/client";
import {
  getFixtureIdentity,
  matchesFixtureIdentity,
} from "@/api/__fixtures__/session";
import {
  fixtureDb,
  fixtureEnvelope,
  fixtureIso,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
  refreshFixtureCustodyCounts,
} from "@/api/__fixtures__/store";

function findAsset(assetId) {
  return fixtureDb.assets.find((asset) => asset.id === assetId);
}

function allocationSummary(asset) {
  return { id: asset.id, asset_tag: asset.asset_tag, name: asset.name };
}

function canManageCustody() {
  return ["admin", "asset_manager"].includes(getFixtureIdentity().role);
}

function allowedAllocationActions(allocation) {
  if (allocation.status !== "active") return [];
  const holder = matchesFixtureIdentity(allocation.holder);
  return [
    ...(holder && !allocation.return_requested ? ["request_return"] : []),
    ...(holder || canManageCustody() ? ["request_transfer"] : []),
    ...(canManageCustody() ? ["check_in"] : []),
  ];
}

function assertCustodyManager() {
  if (!canManageCustody()) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Only asset managers can perform this action.",
      status: 403,
    });
  }
}

function holderFromPayload(payload) {
  if (payload.employee_id) {
    const employee = fixtureDb.employees.find((item) => item.id === payload.employee_id);
    return employee
      ? {
          type: "employee",
          value: {
            id: employee.id,
            name: employee.full_name,
            department_name: employee.department_name,
          },
        }
      : null;
  }

  const department = fixtureDb.departments.find(
    (item) => item.id === payload.department_id,
  );
  return department
    ? { type: "department", value: { id: department.id, name: department.name } }
    : null;
}

export async function fixtureListAllocations(params = {}) {
  let rows = fixtureDb.allocations;
  if (getFixtureIdentity().role === "employee") {
    rows = rows.filter((row) => matchesFixtureIdentity(row.holder));
  }

  if (params.status === "overdue") {
    rows = rows.filter((row) => row.status === "active" && row.is_overdue);
  } else if (params.status) {
    rows = rows.filter((row) => row.status === params.status);
  }

  if (params.asset_id) {
    rows = rows.filter((row) => row.asset.id === params.asset_id);
  }

  if (params.employee_id) {
    rows = rows.filter(
      (row) => row.holder_type === "employee" && row.holder.id === params.employee_id,
    );
  }

  if (params.department_id) {
    rows = rows.filter(
      (row) =>
        row.holder_type === "department" && row.holder.id === params.department_id,
    );
  }

  if (params.mine === true || params.mine === "true") {
    rows = rows.filter((row) => matchesFixtureIdentity(row.holder));
  }

  const page = paginateFixture(rows, params);
  return fixtureResult({
    ...page,
    data: page.data.map((row) => ({
      ...row,
      allowed_actions: allowedAllocationActions(row),
    })),
  });
}

export async function fixtureListAllocationAssets(params = {}) {
  const search = String(params.search ?? "").trim().toLowerCase();
  let rows = fixtureDb.assets.filter((asset) =>
    params.status ? asset.status === params.status : true,
  );

  if (search) {
    rows = rows.filter((asset) =>
      [asset.asset_tag, asset.name, asset.serial_number]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }

  return fixtureResult(paginateFixture(rows, params));
}

export async function fixtureListAllocationEmployees(params = {}) {
  const search = String(params.search ?? "").trim().toLowerCase();
  let rows = fixtureDb.employees.filter((employee) => employee.status === "active");

  if (search) {
    rows = rows.filter((employee) =>
      [employee.full_name, employee.email, employee.department_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search)),
    );
  }

  return fixtureResult(paginateFixture(rows, params));
}

export async function fixtureListAllocationDepartments(params = {}) {
  const search = String(params.search ?? "").trim().toLowerCase();
  let rows = fixtureDb.departments.filter((department) => department.status === "active");

  if (search) {
    rows = rows.filter((department) => department.name.toLowerCase().includes(search));
  }

  return fixtureResult(fixtureEnvelope(rows));
}

export async function fixtureCreateAllocation(payload) {
  assertCustodyManager();
  const asset = findAsset(payload.asset_id);

  if (!asset) {
    throw new ApiError({
      code: "RESOURCE_NOT_FOUND",
      message: "The selected asset no longer exists.",
      status: 404,
    });
  }

  const active = fixtureDb.allocations.find(
    (allocation) => allocation.asset.id === asset.id && allocation.status === "active",
  );

  if (active || asset.current_holder) {
    const holder = active?.holder ?? asset.current_holder;
    throw new ApiError({
      code: "ASSET_ALREADY_ALLOCATED",
      message: `${asset.asset_tag} is already allocated.`,
      status: 409,
      details: {
        current_holder: {
          id: holder?.id,
          name: holder?.name ?? "Current holder",
          type: active?.holder_type ?? asset.current_holder?.type,
        },
        allocated_at: active?.allocated_at ?? null,
        expected_return_date: active?.expected_return_date ?? null,
      },
    });
  }

  const holder = holderFromPayload(payload);
  if (!holder) {
    throw new ApiError({
      code: "VALIDATION_ERROR",
      message: "Choose a valid employee or department.",
      status: 422,
      details: [{ field: "employee_id", message: "Choose a valid holder." }],
    });
  }

  const allocation = {
    id: nextFixtureId("allocation"),
    asset: allocationSummary(asset),
    holder_type: holder.type,
    holder: holder.value,
    allocated_at: new Date().toISOString(),
    expected_return_date: payload.expected_return_date || null,
    returned_at: null,
    status: "active",
    is_overdue: false,
    days_overdue: 0,
    return_requested: false,
    notes: payload.notes || null,
    allowed_actions: [],
  };
  allocation.allowed_actions = allowedAllocationActions(allocation);

  fixtureDb.allocations.unshift(allocation);
  refreshFixtureCustodyCounts();
  asset.status = "allocated";
  asset.current_holder = {
    type: holder.type,
    id: holder.value.id,
    name: holder.value.name,
  };
  asset.updated_at = new Date().toISOString();

  return fixtureResult(fixtureEnvelope(allocation));
}

export async function fixtureRequestReturn(id) {
  const allocation = fixtureDb.allocations.find((row) => row.id === id);
  if (!allocation || allocation.status !== "active") {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This allocation is no longer active.",
      status: 409,
    });
  }
  if (!matchesFixtureIdentity(allocation.holder)) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Only the current holder can request a return.",
      status: 403,
    });
  }

  allocation.return_requested = true;
  return fixtureResult(fixtureEnvelope(allocation));
}

export async function fixtureReturnAllocation(id, payload) {
  assertCustodyManager();
  const allocation = fixtureDb.allocations.find((row) => row.id === id);
  if (!allocation || allocation.status !== "active") {
    throw new ApiError({
      code: "ALREADY_PROCESSED",
      message: "This allocation has already been processed.",
      status: 409,
    });
  }

  allocation.status = "returned";
  allocation.returned_at = new Date().toISOString();
  allocation.is_overdue = false;
  allocation.return_requested = false;
  allocation.return_condition = payload.condition;
  allocation.return_notes = payload.notes || null;
  allocation.allowed_actions = [];

  const asset = findAsset(allocation.asset.id);
  if (asset) {
    asset.status = "available";
    asset.condition = payload.condition;
    asset.current_holder = null;
    asset.updated_at = fixtureIso(0, new Date().getHours(), new Date().getMinutes());
  }

  refreshFixtureCustodyCounts();

  return fixtureResult(fixtureEnvelope(allocation));
}
