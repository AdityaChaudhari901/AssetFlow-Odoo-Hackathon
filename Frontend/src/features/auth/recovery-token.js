const RECOVERY_TOKEN_KEY = "recovery_token";
const MAX_RECOVERY_TOKEN_LENGTH = 4_096;

function getHashParameters(hash) {
  const value = hash.replace(/^#\??/, "");
  return value.includes("=") ? new URLSearchParams(value) : null;
}

export function consumeRecoveryToken() {
  const currentUrl = new URL(window.location.href);
  const hashParameters = getHashParameters(currentUrl.hash);
  const hashToken = hashParameters?.get(RECOVERY_TOKEN_KEY) ?? null;
  const hadQueryToken = currentUrl.searchParams.has(RECOVERY_TOKEN_KEY);
  const hadHashToken = hashParameters?.has(RECOVERY_TOKEN_KEY) ?? false;

  if (hadQueryToken) {
    currentUrl.searchParams.delete(RECOVERY_TOKEN_KEY);
  }

  if (hadHashToken) {
    hashParameters.delete(RECOVERY_TOKEN_KEY);
    const sanitizedHash = hashParameters.toString();
    currentUrl.hash = sanitizedHash ? `#${sanitizedHash}` : "";
  }

  if (hadQueryToken || hadHashToken) {
    const sanitizedPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    window.history.replaceState(window.history.state, document.title, sanitizedPath);
  }

  const token = hadQueryToken ? "" : (hashToken ?? "").trim();

  if (!token || token.length > MAX_RECOVERY_TOKEN_LENGTH) {
    return null;
  }

  return token;
}
