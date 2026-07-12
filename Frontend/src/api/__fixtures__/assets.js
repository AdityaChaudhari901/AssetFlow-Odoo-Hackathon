import { ApiError } from "@/api/client";
import {
  fixtureDb,
  fixtureEnvelope,
  fixtureIso,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
} from "@/api/__fixtures__/store";
import { MANUAL_TRANSITIONS } from "@/lib/constants";

function includesSearch(asset, search) {
  if (!search) {
    return true;
  }

  const haystack = [asset.asset_tag, asset.name, asset.serial_number, asset.location]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function filterAssets(params = {}) {
  return fixtureDb.assets.filter((asset) => {
    if (!includesSearch(asset, params.search)) return false;
    if (params.category_id && asset.category?.id !== params.category_id) return false;
    if (params.status && asset.status !== params.status) return false;
    if (params.department_id && asset.department?.id !== params.department_id) return false;
    if (params.location && !asset.location?.toLowerCase().includes(params.location.toLowerCase())) return false;
    if (params.is_bookable !== undefined && params.is_bookable !== "") {
      const expected = params.is_bookable === true || params.is_bookable === "true";
      if (asset.is_bookable !== expected) return false;
    }
    return true;
  });
}

function hydrateAsset(asset) {
  const allocation = fixtureDb.allocations.find(
    (item) => item.asset.id === asset.id && item.status === "active",
  );

  return {
    ...asset,
    current_allocation: allocation
      ? {
          id: allocation.id,
          employee:
            allocation.holder_type === "employee"
              ? { id: allocation.holder.id, full_name: allocation.holder.name }
              : null,
          department:
            allocation.holder_type === "department"
              ? { id: allocation.holder.id, name: allocation.holder.name }
              : null,
          allocated_at: allocation.allocated_at,
          expected_return_date: allocation.expected_return_date,
          is_overdue: allocation.is_overdue,
        }
      : null,
  };
}

function refreshDepartmentAssetCounts() {
  for (const department of fixtureDb.departments) {
    department.asset_count = fixtureDb.assets.filter(
      (asset) => asset.department?.id === department.id,
    ).length;
  }
}

export async function fixtureListAssets(params = {}) {
  return fixtureResult(paginateFixture(filterAssets(params), params));
}

export async function fixtureGetAsset(id) {
  const asset = fixtureDb.assets.find((item) => item.id === id);

  if (!asset) {
    throw new ApiError({ code: "NOT_FOUND", message: "Asset not found.", status: 404 });
  }

  return fixtureResult(fixtureEnvelope(hydrateAsset(asset)));
}

export async function fixtureCreateAsset(payload) {
  const category = fixtureDb.categories.find((item) => item.id === payload.category_id);
  const department = fixtureDb.departments.find((item) => item.id === payload.department_id);
  const id = nextFixtureId("asset");
  const asset = {
    id,
    asset_tag: `AF-${String(210 + fixtureDb.assets.length).padStart(4, "0")}`,
    name: payload.name,
    serial_number: payload.serial_number || null,
    image_url: payload.image_url || null,
    category: category ? { id: category.id, name: category.name } : null,
    department: department ? { id: department.id, name: department.name } : null,
    status: "available",
    condition: payload.condition,
    location: payload.location || null,
    is_bookable: Boolean(payload.is_bookable),
    current_holder: null,
    acquisition_date: payload.acquisition_date || null,
    acquisition_cost: payload.acquisition_cost ?? null,
    custom_field_values: payload.custom_field_values ?? {},
    open_maintenance_count: 0,
    created_at: fixtureIso(),
    updated_at: fixtureIso(),
  };
  fixtureDb.assets.unshift(asset);
  refreshDepartmentAssetCounts();
  return fixtureResult(fixtureEnvelope(hydrateAsset(asset)));
}

export async function fixtureUpdateAsset(id, payload) {
  const index = fixtureDb.assets.findIndex((item) => item.id === id);

  if (index < 0) {
    throw new ApiError({ code: "NOT_FOUND", message: "Asset not found.", status: 404 });
  }

  const current = fixtureDb.assets[index];
  const category = payload.category_id
    ? fixtureDb.categories.find((item) => item.id === payload.category_id)
    : current.category;
  const department = payload.department_id
    ? fixtureDb.departments.find((item) => item.id === payload.department_id)
    : payload.department_id === null
      ? null
      : current.department;

  fixtureDb.assets[index] = {
    ...current,
    ...payload,
    category: category ? { id: category.id, name: category.name } : null,
    department: department ? { id: department.id, name: department.name } : null,
    updated_at: fixtureIso(),
  };
  delete fixtureDb.assets[index].category_id;
  delete fixtureDb.assets[index].department_id;
  refreshDepartmentAssetCounts();
  return fixtureResult(fixtureEnvelope(hydrateAsset(fixtureDb.assets[index])));
}

export async function fixtureChangeAssetStatus(id, payload) {
  const asset = fixtureDb.assets.find((item) => item.id === id);

  if (!asset) {
    throw new ApiError({ code: "NOT_FOUND", message: "Asset not found.", status: 404 });
  }

  const allowed = MANUAL_TRANSITIONS[asset.status] ?? [];

  if (!allowed.includes(payload.status)) {
    throw new ApiError({
      code: "INVALID_STATUS_TRANSITION",
      message: "That lifecycle transition is no longer available.",
      status: 409,
      details: { allowed },
    });
  }

  asset.status = payload.status;
  asset.updated_at = fixtureIso();
  return fixtureResult(fixtureEnvelope(hydrateAsset(asset)));
}

export async function fixtureGetAssetHistory(id) {
  const asset = fixtureDb.assets.find((item) => item.id === id);

  if (!asset) {
    throw new ApiError({ code: "NOT_FOUND", message: "Asset not found.", status: 404 });
  }

  const allocations = fixtureDb.allocations.filter((item) => item.asset.id === id);
  const maintenance = fixtureDb.maintenance.filter((item) => item.asset.id === id);
  const audits = fixtureDb.audits.flatMap((audit) =>
    (audit.records ?? [])
      .filter((record) => record.asset.id === id)
      .map((record) => ({
        id: record.id,
        audit_id: audit.id,
        audit_name: audit.name,
        result: record.result,
        notes: record.notes,
        audited_at: record.audited_at,
      })),
  );

  return fixtureResult(fixtureEnvelope({ allocations, maintenance, audits }));
}
