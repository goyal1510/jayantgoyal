import { safeReturnPath } from "./redirects";
import { resolveLocalDevelopmentCookieDomain } from "./cookies";

export const CANONICAL_AUTH_ORIGIN = "https://auth.jayantgoyal.com";

export type AuthFlowOwner = "legacy" | "auth";

type HeaderReader = {
  get(name: string): string | null;
};

function firstForwardedValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

export function resolveExternalRequestUrl({
  requestUrl,
  requestHeaders,
}: {
  requestUrl: string;
  requestHeaders?: HeaderReader;
}): URL {
  const internalUrl = new URL(requestUrl);
  if (!requestHeaders) return internalUrl;

  const externalHost =
    firstForwardedValue(requestHeaders.get("x-forwarded-host")) ??
    firstForwardedValue(requestHeaders.get("host"));
  if (!externalHost) return internalUrl;

  const forwardedProtocol = firstForwardedValue(
    requestHeaders.get("x-forwarded-proto"),
  );
  const protocol =
    forwardedProtocol === "http" || forwardedProtocol === "https"
      ? `${forwardedProtocol}:`
      : internalUrl.protocol;

  try {
    const externalOrigin = new URL(`${protocol}//${externalHost}`);
    if (externalOrigin.username || externalOrigin.password) return internalUrl;
    return new URL(
      `${internalUrl.pathname}${internalUrl.search}${internalUrl.hash}`,
      externalOrigin,
    );
  } catch {
    return internalUrl;
  }
}

export function resolveAuthFlowOwner(
  value = process.env.NEXT_PUBLIC_AUTH_FLOW_OWNER,
): AuthFlowOwner {
  return value === "auth" ? "auth" : "legacy";
}

export function resolveAuthApplicationOrigin(
  value: string | null | undefined = process.env.NEXT_PUBLIC_AUTH_URL,
  localCookieDomain: string | null | undefined = process.env
    .NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
): string {
  if (!value) return CANONICAL_AUTH_ORIGIN;

  try {
    const url = new URL(value);
    if (url.username || url.password) return CANONICAL_AUTH_ORIGIN;

    if (url.protocol === "https:" && url.hostname === "auth.jayantgoyal.com") {
      return url.origin;
    }

    const localDevelopmentDomain = resolveLocalDevelopmentCookieDomain(
      localCookieDomain ?? undefined,
    );
    const isLoopbackDevelopmentDomain =
      localDevelopmentDomain?.endsWith(".localhost") ?? false;
    if (
      localDevelopmentDomain &&
      url.hostname === `auth.${localDevelopmentDomain}` &&
      ((isLoopbackDevelopmentDomain &&
        url.protocol === "http:" &&
        url.port === "3003") ||
        (!isLoopbackDevelopmentDomain &&
          url.protocol === "https:" &&
          url.port === ""))
    ) {
      return url.origin;
    }

    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
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
  requestHeaders,
  returnPath,
  authOrigin,
}: {
  requestUrl: string;
  requestHeaders?: HeaderReader;
  returnPath?: string | null;
  authOrigin?: string | null;
}): URL {
  const request = resolveExternalRequestUrl({ requestUrl, requestHeaders });
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
