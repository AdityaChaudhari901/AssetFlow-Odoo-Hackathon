import { request } from "@/api/transport";
import {
  fixtureCreateDepartment,
  fixtureListDepartments,
  fixtureUpdateDepartment,
} from "@/api/__fixtures__/organization";

export function listDepartments(params = {}, signal) {
  return request(
    { method: "GET", url: "/departments", params, signal },
    () => fixtureListDepartments(params),
  );
}

export function createDepartment(payload) {
  return request(
    { method: "POST", url: "/departments", data: payload },
    () => fixtureCreateDepartment(payload),
  );
}

export function updateDepartment(id, payload) {
  return request(
    { method: "PATCH", url: `/departments/${id}`, data: payload },
    () => fixtureUpdateDepartment(id, payload),
  );
}
