const AUTH_ERROR_MESSAGES = Object.freeze({
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_REGISTERED: "An account already exists for this email address.",
  ACCOUNT_INACTIVE:
    "Your account is deactivated. Contact your AssetFlow administrator.",
  VALIDATION_ERROR: "Review the highlighted fields and try again.",
  NETWORK_ERROR:
    "AssetFlow cannot reach the server. Check your connection and try again.",
  REQUEST_TIMEOUT: "The server took too long to respond. Please try again.",
  FRONTEND_NOT_CONFIGURED:
    "AssetFlow is not connected to its API. Ask an administrator to check the frontend configuration.",
});

const FIELD_ALIASES = Object.freeze({
  full_name: "fullName",
  new_password: "password",
  confirm_password: "confirmPassword",
});

const RECOVERY_TOKEN_ERROR_CODES = new Set([
  "INVALID_RECOVERY_TOKEN",
  "EXPIRED_RECOVERY_TOKEN",
  "RECOVERY_TOKEN_EXPIRED",
  "RECOVERY_TOKEN_USED",
]);

function getErrorMessage(error) {
  return (
    AUTH_ERROR_MESSAGES[error?.code] ??
    error?.message ??
    "The request could not be completed. Please try again."
  );
}

function getValidationDetails(details) {
  if (Array.isArray(details)) {
    return details;
  }

  if (Array.isArray(details?.errors)) {
    return details.errors;
  }

  return [];
}

function normalizeFieldName(rawField) {
  const parts = Array.isArray(rawField)
    ? rawField
    : String(rawField ?? "").split(".");
  const field = [...parts]
    .reverse()
    .find((part) => typeof part === "string" && !["body", "query"].includes(part));

  return FIELD_ALIASES[field] ?? field ?? null;
}

function setRootError(setError, error) {
  setError("root.server", {
    type: error?.code ?? "server",
    message: getErrorMessage(error),
    requestId: error?.requestId ?? null,
  });
}

export function applyAuthError(
  error,
  { setError, fields, fieldByCode = {} },
) {
  const allowedFields = new Set(fields);
  const codeField = fieldByCode[error?.code];

  if (codeField && allowedFields.has(codeField)) {
    setError(
      codeField,
      { type: "server", message: getErrorMessage(error) },
      { shouldFocus: true },
    );
    return;
  }

  if (error?.code === "VALIDATION_ERROR") {
    const details = getValidationDetails(error.details);
    let appliedCount = 0;

    for (const detail of details) {
      const field = normalizeFieldName(detail?.field ?? detail?.loc);

      if (!field || !allowedFields.has(field)) {
        continue;
      }

      setError(
        field,
        {
          type: "server",
          message: detail?.message ?? detail?.msg ?? "Review this value.",
        },
        { shouldFocus: appliedCount === 0 },
      );
      appliedCount += 1;
    }

    if (appliedCount > 0) {
      return;
    }
  }

  setRootError(setError, error);
}

export function isRecoveryTokenError(error) {
  if (RECOVERY_TOKEN_ERROR_CODES.has(error?.code)) {
    return true;
  }

  if (error?.code !== "VALIDATION_ERROR") {
    return false;
  }

  return getValidationDetails(error.details).some(
    (detail) => normalizeFieldName(detail?.field ?? detail?.loc) === "recovery_token",
  );
}
