import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import {
  forgotPassword as forgotPasswordRequest,
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  resetPassword as resetPasswordRequest,
  restoreSession,
  signup as signupRequest,
} from "@/api/auth";
import {
  clearSession,
  getSessionGeneration,
  onSessionExpired,
  setSessionIdentity,
  startSession,
  waitForPendingRefresh,
} from "@/api/client";

const AUTH_SYNC_KEY = "assetflow.auth.sync";
const AuthContext = createContext(null);

function isUnauthenticated(error) {
  return (
    error?.status === 401 ||
    [
      "ACCOUNT_INACTIVE",
      "AUTH_REQUIRED",
      "IDENTITY_CHANGED",
      "INVALID_TOKEN",
      "REFRESH_TOKEN_REVOKED",
      "SESSION_EXPIRED",
    ].includes(error?.code)
  );
}

function publishAuthEvent(type) {
  try {
    window.localStorage.setItem(
      AUTH_SYNC_KEY,
      JSON.stringify({ type, occurredAt: Date.now() }),
    );
  } catch {
    // Cross-tab synchronization is best-effort; no credentials are stored here.
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authOperation = useRef(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearAuthenticatedState = useCallback(
    ({ broadcast = false, redirect = false } = {}) => {
      authOperation.current += 1;
      clearSession();
      void queryClient.cancelQueries();
      queryClient.clear();
      setUser(null);
      setAuthError(null);
      setLoading(false);

      if (broadcast) {
        publishAuthEvent("logout");
      }

      if (redirect) {
        navigate("/login", { replace: true });
      }
    },
    [navigate, queryClient],
  );

  const hydrateSession = useCallback(async () => {
    const operation = ++authOperation.current;
    setLoading(true);
    setAuthError(null);

    try {
      const profile = await restoreSession();

      if (operation !== authOperation.current) {
        return null;
      }

      setSessionIdentity(profile.id);
      setUser(profile);
      return profile;
    } catch (error) {
      if (
        operation !== authOperation.current ||
        error?.code === "SESSION_SUPERSEDED"
      ) {
        return null;
      }

      if (isUnauthenticated(error)) {
        clearAuthenticatedState({ broadcast: true });
        void waitForPendingRefresh()
          .then(() => logoutRequest())
          .catch(() => undefined);
        return null;
      }

      clearSession();
      setUser(null);
      setAuthError(error);

      return null;
    } finally {
      if (operation === authOperation.current) {
        setLoading(false);
      }
    }
  }, [clearAuthenticatedState]);

  useEffect(() => {
    void hydrateSession();
  }, [hydrateSession]);

  useEffect(
    () =>
      onSessionExpired(() => {
        clearAuthenticatedState({ broadcast: true, redirect: true });
        void waitForPendingRefresh()
          .then(() => logoutRequest())
          .catch(() => undefined);
      }),
    [clearAuthenticatedState],
  );

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== AUTH_SYNC_KEY || !event.newValue) {
        return;
      }

      try {
        const message = JSON.parse(event.newValue);

        if (message.type === "logout") {
          clearAuthenticatedState({ redirect: true });
        } else if (message.type === "login") {
          clearAuthenticatedState();
          void hydrateSession();
        }
      } catch {
        // Ignore malformed synchronization messages from unrelated scripts.
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearAuthenticatedState, hydrateSession]);

  useEffect(() => {
    async function refreshProfileOnFocus() {
      if (document.visibilityState !== "visible" || !user) {
        return;
      }

      const operation = authOperation.current;
      const generation = getSessionGeneration();

      try {
        const profile = await getCurrentUser();

        if (
          operation !== authOperation.current ||
          generation !== getSessionGeneration()
        ) {
          return;
        }

        setSessionIdentity(profile.id);
        setUser(profile);
        setAuthError(null);
      } catch (error) {
        if (operation !== authOperation.current) {
          return;
        }

        if (isUnauthenticated(error)) {
          clearAuthenticatedState({ broadcast: true, redirect: true });
          void waitForPendingRefresh()
            .then(() => logoutRequest())
            .catch(() => undefined);
          return;
        }

        setAuthError(error);
      }
    }

    document.addEventListener("visibilitychange", refreshProfileOnFocus);
    return () =>
      document.removeEventListener("visibilitychange", refreshProfileOnFocus);
  }, [clearAuthenticatedState, user]);

  const login = useCallback(
    async (email, password) => {
      await waitForPendingRefresh();
      const operation = ++authOperation.current;
      setAuthError(null);
      clearSession();
      setUser(null);
      await queryClient.cancelQueries();
      queryClient.clear();

      const payload = await loginRequest({ email, password });
      if (operation !== authOperation.current) {
        return null;
      }

      startSession(payload.session.access_token, payload.user?.id);
      const profile = payload.user ?? (await getCurrentUser());

      if (operation !== authOperation.current) {
        return null;
      }

      setSessionIdentity(profile.id);
      setUser(profile);
      publishAuthEvent("login");
      return profile;
    },
    [queryClient],
  );

  const signup = useCallback(
    async (payload) => {
      await waitForPendingRefresh();
      const operation = ++authOperation.current;
      setAuthError(null);
      clearSession();
      setUser(null);
      await queryClient.cancelQueries();
      queryClient.clear();

      const result = await signupRequest(payload);

      if (operation !== authOperation.current) {
        return result;
      }

      if (!result.session?.access_token) {
        return result;
      }

      startSession(result.session.access_token, result.user?.id);
      const profile = result.user ?? (await getCurrentUser());

      if (operation !== authOperation.current) {
        return result;
      }

      setSessionIdentity(profile.id);
      setUser(profile);
      publishAuthEvent("login");
      return result;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    clearAuthenticatedState({ broadcast: true, redirect: true });
    await waitForPendingRefresh();

    try {
      await logoutRequest();
    } catch {
      // Local logout must succeed even when the API is unavailable.
    }
  }, [clearAuthenticatedState]);

  const requestPasswordReset = useCallback(
    (email) => forgotPasswordRequest(email),
    [],
  );

  const resetPassword = useCallback(
    async (payload) => {
      await waitForPendingRefresh();
      const result = await resetPasswordRequest(payload);
      clearAuthenticatedState({ broadcast: true });

      try {
        await logoutRequest();
      } catch {
        // The reset endpoint remains responsible for revoking sessions and clearing its cookie.
      }

      return result;
    },
    [clearAuthenticatedState],
  );

  const refreshProfile = useCallback(async () => {
    const operation = authOperation.current;
    const generation = getSessionGeneration();
    const profile = await getCurrentUser();

    if (
      operation !== authOperation.current ||
      generation !== getSessionGeneration()
    ) {
      return null;
    }

    setSessionIdentity(profile.id);
    setUser(profile);
    setAuthError(null);
    return profile;
  }, []);

  const hasRole = useCallback(
    (...roles) => Boolean(user?.role && roles.includes(user.role)),
    [user?.role],
  );

  const hasCapability = useCallback(
    (capability) => Boolean(user?.capabilities?.includes(capability)),
    [user?.capabilities],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      login,
      signup,
      requestPasswordReset,
      resetPassword,
      logout,
      retryAuthentication: hydrateSession,
      refreshProfile,
      hasRole,
      hasCapability,
      isManager: hasRole("admin", "asset_manager"),
    }),
    [
      authError,
      hasCapability,
      hasRole,
      hydrateSession,
      loading,
      login,
      logout,
      requestPasswordReset,
      resetPassword,
      refreshProfile,
      signup,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
