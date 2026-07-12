import { ApiError } from "@/api/client";
import {
  fixtureActor,
  getFixtureIdentity,
  matchesFixtureIdentity,
} from "@/api/__fixtures__/session";
import {
  fixtureDate,
  fixtureDb,
  fixtureEnvelope,
  fixtureIso,
  fixtureResult,
  nextFixtureId,
  paginateFixture,
} from "@/api/__fixtures__/store";

function recalculateProgress(audit) {
  const progress = { total: audit.records.length, verified: 0, missing: 0, damaged: 0, pending: 0 };
  audit.records.forEach((record) => {
    progress[record.result] = (progress[record.result] ?? 0) + 1;
  });
  audit.progress = progress;
}

function findAudit(id) {
  const audit = fixtureDb.audits.find((item) => item.id === id);
  if (!audit) {
    throw new ApiError({ code: "RESOURCE_NOT_FOUND", message: "Audit cycle was not found.", status: 404 });
  }
  return audit;
}

function isAssignedAuditor(audit) {
  return audit.auditors?.some((auditor) => matchesFixtureIdentity(auditor));
}

function auditForCurrentUser(audit) {
  return { ...audit, is_assigned_auditor: isAssignedAuditor(audit) };
}

export async function listAuditFixtures(params = {}) {
  let rows = fixtureDb.audits;
  const identity = getFixtureIdentity();
  if (!["admin", "asset_manager"].includes(identity.role)) {
    rows = rows.filter(isAssignedAuditor);
  }
  if (params.status) rows = rows.filter((audit) => audit.status === params.status);
  const page = paginateFixture(rows, params);
  return fixtureResult(
    fixtureEnvelope(page.data.map(auditForCurrentUser), page.meta),
  );
}

export async function getAuditFixture(id) {
  const audit = findAudit(id);
  const identity = getFixtureIdentity();
  if (
    !["admin", "asset_manager"].includes(identity.role) &&
    !isAssignedAuditor(audit)
  ) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "You are not assigned to this audit cycle.",
      status: 403,
    });
  }
  return fixtureResult(fixtureEnvelope(auditForCurrentUser(audit)));
}

export async function listAuditOptionsFixture() {
  return fixtureResult(
    fixtureEnvelope({
      departments: fixtureDb.departments.filter((item) => item.status === "active"),
      employees: fixtureDb.employees.filter((item) => item.status === "active"),
    }),
  );
}

export async function createAuditFixture(payload) {
  const department = payload.department_id
    ? fixtureDb.departments.find((item) => item.id === payload.department_id) ?? null
    : null;
  const auditors = fixtureDb.employees.filter((employee) => payload.auditor_ids?.includes(employee.id));
  const scopedAssets = fixtureDb.assets.filter((asset) => {
    if (department && asset.department?.id !== department.id) return false;
    if (payload.location && !asset.location?.toLowerCase().includes(payload.location.toLowerCase())) return false;
    return true;
  });
  const records = scopedAssets.map((asset) => ({
    id: nextFixtureId("audit-record"),
    asset: { id: asset.id, asset_tag: asset.asset_tag, name: asset.name, location: asset.location },
    result: "pending",
    notes: null,
    audited_by: null,
    audited_at: null,
  }));
  const audit = {
    id: nextFixtureId("audit"),
    name: payload.name,
    department: department ? { id: department.id, name: department.name } : null,
    location: payload.location || null,
    scope_label: department ? `${department.name} department` : payload.location ? `${payload.location} location` : "Organization-wide",
    start_date: payload.start_date,
    end_date: payload.end_date,
    status: "open",
    auditors,
    progress: { total: records.length, verified: 0, missing: 0, damaged: 0, pending: records.length },
    records,
    is_assigned_auditor: auditors.some((auditor) => matchesFixtureIdentity(auditor)),
    created_at: fixtureIso(),
  };
  fixtureDb.audits.unshift(audit);
  fixtureDb.activityLogs.unshift({
    id: nextFixtureId("activity"),
    actor: fixtureActor(),
    action: "audit.created",
    entity_type: "audit",
    entity_id: audit.id,
    entity_label: audit.name,
    details: { scope: audit.scope_label },
    request_id: nextFixtureId("req-af"),
    created_at: fixtureIso(),
  });
  return fixtureResult(fixtureEnvelope(audit));
}

export async function updateAuditRecordFixture(auditId, payload) {
  const audit = findAudit(auditId);
  if (audit.status === "closed") {
    throw new ApiError({ code: "AUDIT_CYCLE_CLOSED", message: "This audit cycle is closed and cannot be changed.", status: 409 });
  }
  if (!isAssignedAuditor(audit)) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Only assigned auditors can update this cycle.",
      status: 403,
    });
  }
  const record = audit.records.find((item) => item.asset.id === payload.asset_id);
  if (!record) {
    throw new ApiError({ code: "RESOURCE_NOT_FOUND", message: "Audit record was not found.", status: 404 });
  }
  const previousResult = record.result;
  record.result = payload.result;
  record.notes = payload.notes?.trim() || null;
  record.audited_by = fixtureActor();
  record.audited_at = fixtureIso();
  recalculateProgress(audit);
  fixtureDb.activityLogs.unshift({
    id: nextFixtureId("activity"),
    actor: record.audited_by,
    action: "audit.record_updated",
    entity_type: "audit",
    entity_id: audit.id,
    entity_label: audit.name,
    details: {
      asset_tag: record.asset.asset_tag,
      previous_result: previousResult,
      next_result: record.result,
    },
    request_id: nextFixtureId("req-af"),
    created_at: record.audited_at,
  });
  if (
    ["missing", "damaged"].includes(record.result) &&
    previousResult !== record.result
  ) {
    fixtureDb.notifications.unshift({
      id: nextFixtureId("notification"),
      type: "audit_discrepancy",
      title: "Audit discrepancy recorded",
      message: `${record.asset.asset_tag} was marked ${record.result} in ${audit.name}.`,
      entity_type: "audit",
      entity_id: audit.id,
      is_read: false,
      created_at: record.audited_at,
    });
  }
  return fixtureResult(fixtureEnvelope(record));
}

export async function listAuditDiscrepanciesFixture(id) {
  const audit = findAudit(id);
  const discrepancies = audit.records.filter((record) => ["missing", "damaged"].includes(record.result));
  return fixtureResult(fixtureEnvelope(discrepancies));
}

export async function closeAuditFixture(id) {
  const audit = findAudit(id);
  if (!["admin", "asset_manager"].includes(getFixtureIdentity().role)) {
    throw new ApiError({
      code: "FORBIDDEN",
      message: "Only audit managers can close a cycle.",
      status: 403,
    });
  }
  if (audit.status === "closed") {
    throw new ApiError({ code: "AUDIT_CYCLE_CLOSED", message: "This audit cycle is already closed.", status: 409 });
  }
  if (audit.progress.pending > 0) {
    throw new ApiError({
      code: "AUDIT_INCOMPLETE",
      message: "Verify every asset before closing this audit cycle.",
      status: 409,
      details: { pending: audit.progress.pending },
    });
  }
  audit.status = "closed";
  audit.closed_at = fixtureIso();
  audit.records.filter((record) => record.result === "missing").forEach((record) => {
    const asset = fixtureDb.assets.find((item) => item.id === record.asset.id);
    if (asset) asset.status = "lost";
  });
  const summary = { ...audit.progress, closed_at: audit.closed_at };
  fixtureDb.notifications.unshift({
    id: nextFixtureId("notification"),
    type: "audit_discrepancy",
    title: "Audit cycle closed",
    message: `${audit.name} closed with ${audit.progress.missing + audit.progress.damaged} discrepancies.`,
    entity_type: "audit",
    entity_id: audit.id,
    is_read: false,
    created_at: fixtureIso(),
  });
  return fixtureResult(fixtureEnvelope({ audit, summary }));
}

export const defaultAuditDates = { start_date: fixtureDate(0), end_date: fixtureDate(7) };
