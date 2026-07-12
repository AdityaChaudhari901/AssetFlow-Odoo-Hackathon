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

function normalizePerson(person, joinedPerson) {
  if (person && typeof person === "object") {
    return person;
  }

  if (joinedPerson) {
    return joinedPerson;
  }

  return person ? { id: person, full_name: "Unknown user" } : null;
}

function normalizeMaintenanceRequest(maintenanceRequest) {
  if (!maintenanceRequest) {
    return maintenanceRequest;
  }

  return {
    ...maintenanceRequest,
    raised_by: normalizePerson(
      maintenanceRequest.raised_by,
      maintenanceRequest.raised_by_user,
    ),
    reviewed_by: normalizePerson(
      maintenanceRequest.reviewed_by,
      maintenanceRequest.reviewed_by_user,
    ),
    rejection_reason:
      maintenanceRequest.rejection_reason ?? maintenanceRequest.review_notes ?? null,
  };
}

function normalizeMaintenanceResponse(response) {
  if (Array.isArray(response?.data)) {
    return {
      ...response,
      data: response.data.map(normalizeMaintenanceRequest),
    };
  }

  return response?.data
    ? { ...response, data: normalizeMaintenanceRequest(response.data) }
    : response;
}

export async function listMaintenance(params, signal) {
  const response = await request(
    { method: "get", url: "/maintenance", params, signal },
    () => fixtureListMaintenance(params),
  );
  return normalizeMaintenanceResponse(response);
}

export async function getMaintenance(id, signal) {
  const response = await request(
    { method: "get", url: `/maintenance/${id}`, signal },
    () => fixtureGetMaintenance(id),
  );
  return normalizeMaintenanceResponse(response);
}

export async function createMaintenance(payload) {
  const response = await request(
    { method: "post", url: "/maintenance", data: payload },
    () => fixtureCreateMaintenance(payload),
  );
  return normalizeMaintenanceResponse(response);
}

export async function approveMaintenance(id) {
  const response = await request(
    { method: "post", url: `/maintenance/${id}/approve` },
    () => fixtureApproveMaintenance(id),
  );
  return normalizeMaintenanceResponse(response);
}

export async function rejectMaintenance(id, payload) {
  const response = await request(
    { method: "post", url: `/maintenance/${id}/reject`, data: payload },
    () => fixtureRejectMaintenance(id, payload),
  );
  return normalizeMaintenanceResponse(response);
}

export async function assignMaintenance(id, payload) {
  const response = await request(
    { method: "post", url: `/maintenance/${id}/assign`, data: payload },
    () => fixtureAssignMaintenance(id, payload),
  );
  return normalizeMaintenanceResponse(response);
}

export async function startMaintenance(id) {
  const response = await request(
    { method: "post", url: `/maintenance/${id}/start` },
    () => fixtureStartMaintenance(id),
  );
  return normalizeMaintenanceResponse(response);
}

export async function resolveMaintenance(id, payload) {
  const response = await request(
    { method: "post", url: `/maintenance/${id}/resolve`, data: payload },
    () => fixtureResolveMaintenance(id, payload),
  );
  return normalizeMaintenanceResponse(response);
}
