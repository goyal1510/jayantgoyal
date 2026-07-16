/**
 * Resolve an application redirect without allowing protocol-relative or
 * cross-origin navigation. Same-origin absolute URLs are reduced to a path.
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/",
  origin?: string,
): string {
  if (!value || value.includes("\\") || value.startsWith("//")) {
    return fallback;
  }

  if (origin) {
    try {
      const candidate = new URL(value, origin);
      if (candidate.origin !== new URL(origin).origin) return fallback;
      return `${candidate.pathname}${candidate.search}${candidate.hash}`;
    } catch {
      return fallback;
    }
  }

  return value.startsWith("/") ? value : fallback;
}

export const PLATFORM_ALLOWED_ORIGINS = [
  "https://jayantgoyal.com",
  "https://www.jayantgoyal.com",
  "https://studio.jayantgoyal.com",
  "https://admin.jayantgoyal.com",
  "https://auth.jayantgoyal.com",
  "https://portfolio.staging.jayantgoyal.com",
  "https://studio.staging.jayantgoyal.com",
  "https://admin.staging.jayantgoyal.com",
  "https://auth.staging.jayantgoyal.com",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
  "http://127.0.0.1:3003",
] as const;

/**
 * Resolve Auth's cross-application return target against the platform allowlist.
 * Relative paths stay relative; absolute URLs must match an exact trusted origin.
 */
export function safeRedirectTarget(
  value: string | null | undefined,
  fallback = "/",
  allowedOrigins: readonly string[] = PLATFORM_ALLOWED_ORIGINS,
): string {
  if (!value || value.includes("\\") || value.startsWith("//")) {
    return fallback;
  }
  if (value.startsWith("/")) return value;

  try {
    const candidate = new URL(value);
    if (allowedOrigins.includes(candidate.origin)) return candidate.toString();
  } catch {
    return fallback;
  }

  return fallback;
}
