import axios from "axios";

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseURL = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "") : "/";
const REQUEST_TIMEOUT_MS = 15_000;
const SESSION_REFRESH_TIMEOUT_MS = 5_000;
const SESSION_EXPIRED_EVENT = "assetflow:session-expired";
const SESSION_LOCK_NAME = "assetflow.session.operation";

let accessToken = null;
let sessionUserId = null;
let refreshPromise = null;
let refreshPromiseGeneration = null;
let sessionGeneration = 0;
let sessionExpiredEmitted = false;

export class ApiError extends Error {
  constructor({ code, message, status = 0, details = null, requestId = null }) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }
}

const configurationError = rawBaseUrl
  ? null
  : new ApiError({
      code: "FRONTEND_NOT_CONFIGURED",
      message:
        "AssetFlow is missing VITE_API_BASE_URL. Copy .env.example to .env and configure the FastAPI URL.",
    });

export const authApi = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

export const api = axios.create({
  baseURL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

function getRequestId(error) {
  return (
    error.response?.data?.error?.request_id ??
    error.response?.headers?.["x-request-id"] ??
    null
  );
}

export function normalizeApiError(error) {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError({
      code: "REQUEST_CANCELLED",
      message: "The request was cancelled.",
    });
  }

  if (error?.code === "ECONNABORTED") {
    return new ApiError({
      code: "REQUEST_TIMEOUT",
      message: "The server took too long to respond. Please try again.",
    });
  }

  if (!error?.response) {
    return new ApiError({
      code: "NETWORK_ERROR",
      message: "AssetFlow cannot reach the server. Check your connection and try again.",
    });
  }

  const status = error.response.status ?? 0;
  const payload = error.response.data?.error;
  const fallbackCode = status >= 500 ? "SERVER_ERROR" : "HTTP_ERROR";
  const fallbackMessage =
    status >= 500
      ? "The server could not complete the request. Please try again."
      : "The request could not be completed.";

  return new ApiError({
    code: payload?.code ?? fallbackCode,
    message: payload?.message ?? fallbackMessage,
    status,
    details: payload?.details ?? null,
    requestId: getRequestId(error),
  });
}

function requireConfiguration(config) {
  if (configurationError) {
    throw configurationError;
  }

  return config;
}

function setAuthorizationHeader(config, token) {
  if (typeof config.headers?.set === "function") {
    config.headers.set("Authorization", `Bearer ${token}`);
  } else {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getSessionGeneration() {
  return sessionGeneration;
}

function sessionSuperseded(message = "The session changed while the request was in progress.") {
  return new ApiError({
    code: "SESSION_SUPERSEDED",
    message,
  });
}

export function startSession(token, userId = null) {
  sessionGeneration += 1;
  accessToken = token || null;
  sessionUserId = userId || null;
  sessionExpiredEmitted = false;
}

export function setSessionIdentity(userId) {
  sessionUserId = userId || null;
}

export function clearSession() {
  sessionGeneration += 1;
  accessToken = null;
  sessionUserId = null;
}

export function onSessionExpired(listener) {
  window.addEventListener(SESSION_EXPIRED_EVENT, listener);

  return () => window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
}

function emitSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

function expireSession(requestId = null) {
  if (!sessionExpiredEmitted) {
    sessionGeneration += 1;
    accessToken = null;
    sessionUserId = null;
    sessionExpiredEmitted = true;
    emitSessionExpired();
  }

  return new ApiError({
    code: "SESSION_EXPIRED",
    message: "Your session expired. Please sign in again.",
    status: 401,
    requestId,
  });
}

function isTerminalAuthenticationFailure(error) {
  return (
    error.status === 401 ||
    [
      "ACCOUNT_INACTIVE",
      "AUTH_REQUIRED",
      "IDENTITY_CHANGED",
      "INVALID_SESSION_RESPONSE",
      "INVALID_TOKEN",
      "REFRESH_TOKEN_REVOKED",
      "SESSION_EXPIRED",
    ].includes(error.code)
  );
}

export async function withSessionLock(callback) {
  if (navigator.locks?.request) {
    return navigator.locks.request(SESSION_LOCK_NAME, callback);
  }

  return callback();
}

async function requestAccessToken(requestGeneration) {
  if (requestGeneration !== sessionGeneration) {
    throw sessionSuperseded("The session changed before it could be refreshed.");
  }

  const { data } = await authApi.post("/auth/refresh", undefined, {
    timeout: SESSION_REFRESH_TIMEOUT_MS,
  });
  const session = data?.data?.session;
  const token = session?.access_token;
  const user = data?.data?.user ?? null;
  const refreshedUserId = session?.user_id ?? data?.data?.user?.id ?? null;

  if (!token) {
    throw new ApiError({
      code: "INVALID_SESSION_RESPONSE",
      message: "The server returned an invalid session.",
    });
  }

  if (requestGeneration !== sessionGeneration) {
    throw sessionSuperseded("The session changed while it was being refreshed.");
  }

  if (sessionUserId && refreshedUserId && sessionUserId !== refreshedUserId) {
    throw new ApiError({
      code: "IDENTITY_CHANGED",
      message: "The authenticated identity changed in another browser context.",
      status: 401,
    });
  }

  accessToken = token;
  sessionUserId = refreshedUserId ?? sessionUserId;
  sessionExpiredEmitted = false;
  return { accessToken: token, user };
}

export function refreshAccessToken(expectedGeneration = sessionGeneration) {
  if (expectedGeneration !== sessionGeneration) {
    return Promise.reject(
      sessionSuperseded("The session changed before refresh could begin."),
    );
  }

  if (refreshPromise) {
    if (refreshPromiseGeneration !== expectedGeneration) {
      return refreshPromise
        .catch(() => undefined)
        .then(() => {
          if (expectedGeneration !== sessionGeneration) {
            throw sessionSuperseded(
              "The session changed while an older refresh was finishing.",
            );
          }
          return refreshAccessToken(expectedGeneration);
        });
    }
    return refreshPromise;
  }

  const requestGeneration = expectedGeneration;
  const request = withSessionLock(() => requestAccessToken(requestGeneration))
    .catch((error) => {
      throw normalizeApiError(error);
    })
    .finally(() => {
      if (refreshPromise === request) {
        refreshPromise = null;
        refreshPromiseGeneration = null;
      }
    });

  refreshPromise = request;
  refreshPromiseGeneration = requestGeneration;
  return request;
}

export async function waitForPendingRefresh() {
  if (!refreshPromise) {
    return;
  }

  try {
    await refreshPromise;
  } catch {
    // Login and logout still need to run after a failed or superseded refresh.
  }
}

authApi.interceptors.request.use(requireConfiguration);
api.interceptors.request.use((config) => {
  const configuredRequest = requireConfiguration(config);
  configuredRequest._assetFlowGeneration = sessionGeneration;

  if (accessToken) {
    setAuthorizationHeader(configuredRequest, accessToken);
  }

  return configuredRequest;
});

api.interceptors.response.use(
  (response) => {
    const requestGeneration = response.config?._assetFlowGeneration;
    if (
      requestGeneration !== undefined &&
      requestGeneration !== sessionGeneration
    ) {
      throw sessionSuperseded();
    }
    return response;
  },
  async (error) => {
    const normalizedError = normalizeApiError(error);
    const originalRequest = error?.config;

    if (normalizedError.status !== 401) {
      throw normalizedError;
    }

    if (!originalRequest) {
      throw expireSession(normalizedError.requestId);
    }

    const requestGeneration = originalRequest._assetFlowGeneration;
    if (
      requestGeneration !== undefined &&
      requestGeneration !== sessionGeneration
    ) {
      throw sessionSuperseded();
    }

    if (originalRequest._assetFlowRetried) {
      throw expireSession(normalizedError.requestId);
    }

    originalRequest._assetFlowRetried = true;

    try {
      const { accessToken } = await refreshAccessToken(requestGeneration);
      if (requestGeneration !== sessionGeneration) {
        throw sessionSuperseded("The session changed before retrying the request.");
      }
      setAuthorizationHeader(originalRequest, accessToken);
      return api(originalRequest);
    } catch (refreshError) {
      const normalizedRefreshError = normalizeApiError(refreshError);

      if (normalizedRefreshError.code === "SESSION_SUPERSEDED") {
        throw normalizedRefreshError;
      }

      if (isTerminalAuthenticationFailure(normalizedRefreshError)) {
        throw expireSession(normalizedRefreshError.requestId);
      }

      throw normalizedRefreshError;
    }
  },
);
