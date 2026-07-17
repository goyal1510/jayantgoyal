const VALIDATION_ORIGIN = "https://auth-redirect.invalid";

function normalizeRelativePath(
  value: string | null | undefined,
): string | null {
  if (!value?.startsWith("/")) return null;

  try {
    const url = new URL(value, VALIDATION_ORIGIN);
    if (url.origin !== VALIDATION_ORIGIN) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function safeReturnPath(
  value: string | null | undefined,
  fallback = "/",
): string {
  return normalizeRelativePath(value) ?? normalizeRelativePath(fallback) ?? "/";
}
