const AUTH_ROUTES = new Set([
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

const INTERNAL_ORIGIN = "https://assetflow.local";

function buildCandidate(from) {
  if (typeof from === "string") {
    return from;
  }

  if (!from || typeof from.pathname !== "string") {
    return null;
  }

  const search = typeof from.search === "string" ? from.search : "";
  const hash = typeof from.hash === "string" ? from.hash : "";
  return `${from.pathname}${search}${hash}`;
}

export function getSafeReturnPath(from, fallback = "/") {
  const candidate = buildCandidate(from);

  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return fallback;
  }

  try {
    const destination = new URL(candidate, INTERNAL_ORIGIN);

    if (
      destination.origin !== INTERNAL_ORIGIN ||
      AUTH_ROUTES.has(destination.pathname)
    ) {
      return fallback;
    }

    const normalizedPath = `${destination.pathname}${destination.search}${destination.hash}`;

    if (
      !normalizedPath.startsWith("/") ||
      normalizedPath.startsWith("//") ||
      normalizedPath.includes("\\") ||
      /[\u0000-\u001f\u007f]/.test(normalizedPath)
    ) {
      return fallback;
    }

    return normalizedPath;
  } catch {
    return fallback;
  }
}
