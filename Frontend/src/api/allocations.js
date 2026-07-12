import {
  fixtureCreateAllocation,
  fixtureListAllocationAssets,
  fixtureListAllocationDepartments,
  fixtureListAllocationEmployees,
  fixtureListAllocations,
  fixtureRequestReturn,
  fixtureReturnAllocation,
} from "@/api/__fixtures__/allocations";
import { request } from "@/api/transport";

export const listAllocations = (params, signal) =>
  request({ method: "get", url: "/allocations", params, signal }, () =>
    fixtureListAllocations(params),
  );

export const createAllocation = (payload) =>
  request({ method: "post", url: "/allocations", data: payload }, () =>
    fixtureCreateAllocation(payload),
  );

export const requestAllocationReturn = (id) =>
  request({ method: "post", url: `/allocations/${id}/return-request` }, () =>
    fixtureRequestReturn(id),
  );

export const returnAllocation = (id, payload) =>
  request({ method: "post", url: `/allocations/${id}/return`, data: payload }, () =>
    fixtureReturnAllocation(id, payload),
  );

export const listAllocationAssets = (params, signal) =>
  request({ method: "get", url: "/assets", params, signal }, () =>
    fixtureListAllocationAssets(params),
  );

export const listAllocationEmployees = (params, signal) =>
  request({ method: "get", url: "/employees/picker", params, signal }, () =>
    fixtureListAllocationEmployees(params),
  );

export const listAllocationDepartments = (params, signal) =>
  request({ method: "get", url: "/departments", params, signal }, () =>
    fixtureListAllocationDepartments(params),
  );
