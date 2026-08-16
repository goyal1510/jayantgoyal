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

function normalizeAllowedOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function normalizeReturnTarget(
  value: string | null | undefined,
  requestOrigin: string,
  allowedOrigins: Set<string>,
): string | null {
  const relativePath = normalizeRelativePath(value);
  if (relativePath) return relativePath;
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    if (!allowedOrigins.has(url.origin)) return null;
    if (url.origin === requestOrigin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function safeReturnTarget(
  value: string | null | undefined,
  {
    requestOrigin,
    allowedOrigins = [],
    fallback = "/",
  }: {
    requestOrigin: string;
    allowedOrigins?: readonly string[];
    fallback?: string;
  },
): string {
  const normalizedRequestOrigin = normalizeAllowedOrigin(requestOrigin);
  if (!normalizedRequestOrigin) return safeReturnPath(fallback);

  const normalizedAllowedOrigins = new Set<string>([normalizedRequestOrigin]);
  allowedOrigins.forEach((origin) => {
    const normalized = normalizeAllowedOrigin(origin);
    if (normalized) normalizedAllowedOrigins.add(normalized);
  });

  return (
    normalizeReturnTarget(
      value,
      normalizedRequestOrigin,
      normalizedAllowedOrigins,
    ) ??
    normalizeReturnTarget(
      fallback,
      normalizedRequestOrigin,
      normalizedAllowedOrigins,
    ) ??
    "/"
  );
}
