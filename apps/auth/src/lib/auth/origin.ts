type HeaderReader = {
  get(name: string): string | null;
};

function firstForwardedValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function normalizeOrigin(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function requestOriginFromHeaders(
  headerStore: HeaderReader,
  fallback: string,
): string {
  const host =
    firstForwardedValue(headerStore.get("x-forwarded-host")) ??
    firstForwardedValue(headerStore.get("host"));
  const protocol =
    firstForwardedValue(headerStore.get("x-forwarded-proto")) ??
    (host?.startsWith("localhost") ||
    host?.startsWith("127.0.0.1") ||
    host?.split(":")[0]?.endsWith(".localhost")
      ? "http"
      : "https");
  const requestOrigin = host ? normalizeOrigin(`${protocol}://${host}`) : null;
  return requestOrigin ?? normalizeOrigin(fallback) ?? "http://localhost:3003";
}

export function isTrustedMutationOrigin({
  suppliedOrigin,
  requestOrigin,
}: {
  suppliedOrigin: string | null | undefined;
  requestOrigin: string;
}): boolean {
  const supplied = normalizeOrigin(suppliedOrigin);
  const expected = normalizeOrigin(requestOrigin);
  return Boolean(supplied && expected && supplied === expected);
}
