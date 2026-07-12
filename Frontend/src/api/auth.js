import {
  ApiError,
  api,
  authApi,
  normalizeApiError,
  refreshAccessToken,
  withSessionLock,
} from "@/api/client";

let restorePromise = null;

function unwrapData(response) {
  return response.data?.data;
}

async function runAuthRequest(request) {
  try {
    return unwrapData(await request());
  } catch (error) {
    throw normalizeApiError(error);
  }
}

export function login(credentials) {
  return runAuthRequest(async () => {
    const response = await withSessionLock(() =>
      authApi.post("/auth/login", credentials),
    );
    const payload = unwrapData(response);

    if (!payload?.session?.access_token) {
      throw new ApiError({
        code: "INVALID_SESSION_RESPONSE",
        message: "The server returned an invalid login session.",
      });
    }

    return response;
  });
}

export function signup(payload) {
  return runAuthRequest(async () => {
    const response = await withSessionLock(() =>
      authApi.post("/auth/signup", payload),
    );
    return response;
  });
}

export function forgotPassword(email) {
  return runAuthRequest(() =>
    authApi.post("/auth/forgot-password", { email }),
  );
}

export function resetPassword(payload) {
  return runAuthRequest(() => authApi.post("/auth/reset-password", payload));
}

export function logout() {
  return runAuthRequest(() =>
    withSessionLock(() => authApi.post("/auth/logout")),
  );
}

export function getCurrentUser() {
  return runAuthRequest(() => api.get("/auth/me"));
}

export function restoreSession() {
  if (restorePromise) {
    return restorePromise;
  }

  const request = refreshAccessToken()
    .then(() => getCurrentUser())
    .finally(() => {
      if (restorePromise === request) {
        restorePromise = null;
      }
    });

  restorePromise = request;
  return request;
}
