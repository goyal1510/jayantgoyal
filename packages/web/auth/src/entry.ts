import { PRODUCT_IDENTITIES } from "@jayantgoyal/identity";

import { safeReturnPath } from "./redirects";
import { resolveLocalDevelopmentCookieDomain } from "./cookies";
import { authSurfacePath } from "./surface";

export const CANONICAL_AUTH_ORIGIN = PRODUCT_IDENTITIES.auth.canonicalOrigin;

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

export function resolveAuthApplicationOrigin(
  value: string | null | undefined = process.env.NEXT_PUBLIC_AUTH_URL,
  localCookieDomain: string | null | undefined = process.env
    .NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
): string {
  if (!value) return CANONICAL_AUTH_ORIGIN;

  try {
    const url = new URL(value);
    if (url.username || url.password) return CANONICAL_AUTH_ORIGIN;

    if (
      url.protocol === "https:" &&
      (PRODUCT_IDENTITIES.auth.canonicalHosts as readonly string[]).includes(
        url.hostname,
      )
    ) {
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

function authOriginForRequest(
  request: URL,
  configuredOrigin?: string | null,
): string {
  if (configuredOrigin || process.env.NEXT_PUBLIC_AUTH_URL) {
    return resolveAuthApplicationOrigin(configuredOrigin);
  }

  if (request.hostname === "localhost" || request.hostname === "127.0.0.1") {
    return resolveAuthApplicationOrigin("http://localhost:3003");
  }

  if (request.hostname.endsWith(".localhost")) {
    const domain = request.hostname.split(".").slice(1).join(".");
    return resolveAuthApplicationOrigin(`http://auth.${domain}:3003`, domain);
  }

  return resolveAuthApplicationOrigin(configuredOrigin);
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
    authSurfacePath("welcome"),
    `${authOriginForRequest(request, authOrigin)}/`,
  );
  const targetPath = safeReturnPath(returnPath, "/");
  const returnTarget = new URL(targetPath, `${request.origin}/`);
  loginUrl.searchParams.set("return_to", returnTarget.toString());
  return loginUrl;
}

export function buildAuthForgotPasswordUrl({
  requestUrl,
  requestHeaders,
  authOrigin,
}: {
  requestUrl: string;
  requestHeaders?: HeaderReader;
  authOrigin?: string | null;
}): URL {
  const request = resolveExternalRequestUrl({ requestUrl, requestHeaders });
  return new URL(
    authSurfacePath("forgot-password"),
    `${authOriginForRequest(request, authOrigin)}/`,
  );
}

export function buildAuthMfaUrl({
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
  const destination = new URL(
    authSurfacePath("mfa"),
    `${authOriginForRequest(request, authOrigin)}/`,
  );
  const targetPath = safeReturnPath(returnPath, "/");
  destination.searchParams.set(
    "return_to",
    new URL(targetPath, `${request.origin}/`).toString(),
  );
  return destination;
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
    pathname === "/account/security"
      ? authSurfacePath("account-security")
      : authSurfacePath("logout"),
    `${authOriginForRequest(request, authOrigin)}/`,
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
