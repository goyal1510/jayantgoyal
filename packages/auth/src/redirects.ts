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
