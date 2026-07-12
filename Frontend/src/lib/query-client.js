import { QueryClient } from "@tanstack/react-query";

function shouldRetryQuery(failureCount, error) {
  if (failureCount >= 1) {
    return false;
  }

  if (["NETWORK_ERROR", "REQUEST_TIMEOUT"].includes(error?.code)) {
    return true;
  }

  return (
    error?.status === 408 ||
    error?.status === 429 ||
    error?.status >= 500
  );
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
