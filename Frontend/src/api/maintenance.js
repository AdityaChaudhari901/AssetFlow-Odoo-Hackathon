import {
  fixtureApproveMaintenance,
  fixtureAssignMaintenance,
  fixtureCreateMaintenance,
  fixtureGetMaintenance,
  fixtureListMaintenance,
  fixtureRejectMaintenance,
  fixtureResolveMaintenance,
  fixtureStartMaintenance,
} from "@/api/__fixtures__/maintenance";
import { request } from "@/api/transport";

export const listMaintenance = (params, signal) =>
  request({ method: "get", url: "/maintenance", params, signal }, () => fixtureListMaintenance(params));

export const getMaintenance = (id, signal) =>
  request({ method: "get", url: `/maintenance/${id}`, signal }, () => fixtureGetMaintenance(id));

export const createMaintenance = (payload) =>
  request({ method: "post", url: "/maintenance", data: payload }, () => fixtureCreateMaintenance(payload));

export const approveMaintenance = (id) =>
  request({ method: "post", url: `/maintenance/${id}/approve` }, () => fixtureApproveMaintenance(id));

export const rejectMaintenance = (id, payload) =>
  request({ method: "post", url: `/maintenance/${id}/reject`, data: payload }, () => fixtureRejectMaintenance(id, payload));

export const assignMaintenance = (id, payload) =>
  request({ method: "post", url: `/maintenance/${id}/assign`, data: payload }, () => fixtureAssignMaintenance(id, payload));

export const startMaintenance = (id) =>
  request({ method: "post", url: `/maintenance/${id}/start` }, () => fixtureStartMaintenance(id));

export const resolveMaintenance = (id, payload) =>
  request({ method: "post", url: `/maintenance/${id}/resolve`, data: payload }, () => fixtureResolveMaintenance(id, payload));
