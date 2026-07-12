import { setApiFieldError } from "@/lib/forms";

const FIELD_ALIASES = Object.freeze({
  full_name: "fullName",
  head_id: "headId",
  parent_department_id: "parentDepartmentId",
  department_id: "departmentId",
  custom_fields: "customFields",
});

function validationDetails(details) {
  if (Array.isArray(details)) {
    return details;
  }

  return Array.isArray(details?.errors) ? details.errors : [];
}

function organizationFieldPath(rawField) {
  const parts = (Array.isArray(rawField)
    ? rawField
    : String(rawField ?? "").split("."))
    .map(String)
    .filter((part) => !["body", "query"].includes(part));

  if (!parts.length) {
    return null;
  }

  const [first, ...remaining] = parts;
  return [FIELD_ALIASES[first] ?? first, ...remaining].join(".");
}

function applyOrganizationValidationErrors(error, setError, allowedFields) {
  if (error?.code !== "VALIDATION_ERROR") {
    return false;
  }

  const allowed = new Set(allowedFields);
  let applied = 0;

  for (const detail of validationDetails(error.details)) {
    const fieldPath = organizationFieldPath(detail?.field ?? detail?.loc);
    const rootField = fieldPath?.split(".")[0];

    if (!fieldPath || !allowed.has(rootField)) {
      continue;
    }

    setError(
      fieldPath,
      {
        type: "server",
        message: detail?.message ?? detail?.msg ?? "Review this value.",
      },
      { shouldFocus: applied === 0 },
    );
    applied += 1;
  }

  return applied > 0;
}

function setRootError(setError, error) {
  setError("root.server", {
    type: error?.code ?? "server",
    message: error?.message ?? "The request could not be completed.",
    requestId: error?.requestId ?? null,
  });
}

export function applyOrganizationError(
  error,
  setError,
  { fields = [], duplicateField = "name" } = {},
) {
  if (
    error?.code === "DUPLICATE_RESOURCE" &&
    fields.includes(duplicateField) &&
    (!error.details?.field || error.details.field === duplicateField)
  ) {
    setApiFieldError(
      setError,
      duplicateField,
      error,
      "A record with this name already exists.",
    );
    return;
  }

  if (applyOrganizationValidationErrors(error, setError, fields)) {
    return;
  }

  setRootError(setError, error);
}
