import { fixturesEnabled, request } from "@/api/transport";
import {
  closeAuditFixture,
  createAuditFixture,
  getAuditFixture,
  listAuditDiscrepanciesFixture,
  listAuditFixtures,
  listAuditOptionsFixture,
  updateAuditRecordFixture,
} from "@/api/__fixtures__/audits";

export const listAudits = (params, signal) => request({ method: "get", url: "/audits", params, signal }, () => listAuditFixtures(params));
export const getAudit = (id, signal) => request({ method: "get", url: `/audits/${id}`, signal }, () => getAuditFixture(id));
export const createAudit = (payload) => request({ method: "post", url: "/audits", data: payload }, () => createAuditFixture(payload));
export const updateAuditRecord = (id, payload) => request({ method: "post", url: `/audits/${id}/records`, data: payload }, () => updateAuditRecordFixture(id, payload));
export const listAuditDiscrepancies = (id, signal) => request({ method: "get", url: `/audits/${id}/discrepancies`, signal }, () => listAuditDiscrepanciesFixture(id));
export const closeAudit = (id) => request({ method: "post", url: `/audits/${id}/close` }, () => closeAuditFixture(id));
export async function listAuditOptions(signal) {
  if (fixturesEnabled) return listAuditOptionsFixture();
  const [departments, employees] = await Promise.all([
    request({ method: "get", url: "/departments", params: { status: "active" }, signal }),
    request({ method: "get", url: "/employees", params: { status: "active", limit: 100 }, signal }),
  ]);
  return { data: { departments: departments.data ?? [], employees: employees.data ?? [] } };
}
