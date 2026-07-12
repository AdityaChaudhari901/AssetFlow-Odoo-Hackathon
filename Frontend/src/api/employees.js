import { request } from "@/api/transport";
import {
  fixtureGetEmployee,
  fixtureListEmployees,
  fixtureUpdateEmployee,
} from "@/api/__fixtures__/organization";

export function listEmployees(params = {}, signal) {
  return request(
    { method: "GET", url: "/employees", params, signal },
    () => fixtureListEmployees(params),
  );
}

export function getEmployee(id, signal) {
  return request(
    { method: "GET", url: `/employees/${id}`, signal },
    () => fixtureGetEmployee(id),
  );
}

export function updateEmployee(id, payload) {
  return request(
    { method: "PATCH", url: `/employees/${id}`, data: payload },
    () => fixtureUpdateEmployee(id, payload),
  );
}
