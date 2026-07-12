const FIELD_ALIASES = Object.freeze({
  full_name: "fullName",
  department_id: "departmentId",
  category_id: "categoryId",
  employee_id: "employeeId",
  asset_id: "assetId",
  start_time: "startTime",
  end_time: "endTime",
  expected_return_date: "expectedReturnDate",
  technician_name: "technicianName",
  resolution_notes: "resolutionNotes",
  custom_fields: "customFields",
  auditor_ids: "auditorIds",
  start_date: "dates",
  end_date: "dates",
  serial_number: "serialNumber",
  acquisition_date: "acquisitionDate",
  acquisition_cost: "acquisitionCost",
  image_url: "imageUrl",
  photo_url: "photoUrl",
  is_bookable: "isBookable",
  custom_field_values: "customFieldValues",
});

function validationDetails(details) {
  if (Array.isArray(details)) {
    return details;
  }

  return Array.isArray(details?.errors) ? details.errors : [];
}

function normalizeField(rawField, aliases = {}) {
  const parts = (Array.isArray(rawField)
    ? rawField
    : String(rawField ?? "").split("."))
    .map(String)
    .filter((part) => !["body", "query"].includes(part));
  const [root, ...remaining] = parts;
  const mappedRoot = aliases[root] ?? FIELD_ALIASES[root];

  if (mappedRoot) {
    return remaining.length
      ? `${mappedRoot}.${remaining.join(".")}`
      : mappedRoot;
  }

  const candidate = [...parts].reverse().find(Boolean);

  return aliases[candidate] ?? FIELD_ALIASES[candidate] ?? candidate ?? null;
}

export function applyValidationErrors(
  error,
  setError,
  allowedFields = [],
  aliases = {},
) {
  if (error?.code !== "VALIDATION_ERROR") {
    return false;
  }

  const allowed = new Set(allowedFields);
  let applied = 0;

  for (const detail of validationDetails(error.details)) {
    const field = normalizeField(detail?.field ?? detail?.loc, aliases);
    const rootField = field?.split(".")[0];

    if (!field || (allowed.size && !allowed.has(field) && !allowed.has(rootField))) {
      continue;
    }

    setError(
      field,
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

export function setApiFieldError(setError, field, error, fallback) {
  setError(
    field,
    {
      type: "server",
      message: error?.message || fallback || "Review this value.",
    },
    { shouldFocus: true },
  );
}
