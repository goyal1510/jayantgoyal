import { safeReturnPath } from "./redirects";

export const CANONICAL_AUTH_ORIGIN = "https://auth.jayantgoyal.com";

export type AuthFlowOwner = "legacy" | "auth";

export function resolveAuthFlowOwner(
  value = process.env.NEXT_PUBLIC_AUTH_FLOW_OWNER,
): AuthFlowOwner {
  return value === "auth" ? "auth" : "legacy";
}

export function resolveAuthApplicationOrigin(
  value: string | null | undefined = process.env.NEXT_PUBLIC_AUTH_URL,
): string {
  if (!value) return CANONICAL_AUTH_ORIGIN;

  try {
    const url = new URL(value);
    if (url.username || url.password) return CANONICAL_AUTH_ORIGIN;

    if (
      url.protocol === "https:" &&
      url.hostname === "auth.jayantgoyal.com"
    ) {
      return url.origin;
    }

    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(
      url.hostname,
    );
    if (url.protocol === "http:" && isLocal && url.port === "3003") {
      return url.origin;
    }
  } catch {
    // Fall through to the canonical production origin.
  }

  return CANONICAL_AUTH_ORIGIN;
}

export function buildAuthLoginUrl({
  requestUrl,
  returnPath,
  authOrigin,
}: {
  requestUrl: string;
  returnPath?: string | null;
  authOrigin?: string | null;
}): URL {
  const request = new URL(requestUrl);
  const loginUrl = new URL(
    "/login",
    `${resolveAuthApplicationOrigin(authOrigin)}/`,
  );
  const targetPath = safeReturnPath(returnPath, "/");
  const returnTarget = new URL(targetPath, `${request.origin}/`);
  loginUrl.searchParams.set("return_to", returnTarget.toString());
  return loginUrl;
}

function buildAuthOwnedUrl({
  pathname,
  requestUrl,
  authOrigin,
}: {
  pathname: "/account/security" | "/logout";
  requestUrl: string;
  authOrigin?: string | null;
}): URL {
  const request = new URL(requestUrl);
  const destination = new URL(
    pathname,
    `${resolveAuthApplicationOrigin(authOrigin)}/`,
  );
  destination.searchParams.set("return_to", request.toString());
  return destination;
}

export function buildAuthAccountSecurityUrl(options: {
  requestUrl: string;
  authOrigin?: string | null;
}): URL {
  return buildAuthOwnedUrl({ pathname: "/account/security", ...options });
}

export function buildAuthLogoutUrl(options: {
  requestUrl: string;
  authOrigin?: string | null;
}): URL {
  return buildAuthOwnedUrl({ pathname: "/logout", ...options });
}
