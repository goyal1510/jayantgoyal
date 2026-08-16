import type { CookieOptions } from "@supabase/ssr";

export const PLATFORM_SESSION_COOKIE_NAME = "__Secure-jg-session-v1";
export const LOCAL_SESSION_COOKIE_NAME = "jg-session-v1";
export const PLATFORM_SESSION_COOKIE_DOMAIN = "jayantgoyal.com";
export const LOCAL_DEVELOPMENT_COOKIE_DOMAIN_SUFFIXES = [
  ".test",
  ".localhost",
] as const;

export type AuthSessionMode = "legacy" | "compatibility" | "platform";
export type SessionCookieOptions = CookieOptions & { name: string };
export type RequestSessionSource = "legacy" | "platform" | "promote";

type CookieValue = { name: string; value: string };

const TRUSTED_PLATFORM_HOSTS = new Set([
  "jayantgoyal.com",
  "www.jayantgoyal.com",
  "studio.jayantgoyal.com",
  "admin.jayantgoyal.com",
  "auth.jayantgoyal.com",
]);

function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) return "";

  const value = hostname.trim().toLowerCase();
  if (value === "::1" || value === "[::1]") return "::1";
  try {
    return new URL(`http://${value}`).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return value.replace(/^\[|\]$/g, "").split(":")[0] ?? "";
  }
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

export function resolveLocalDevelopmentCookieDomain(
  value = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
): string | null {
  const candidate = value?.trim().toLowerCase().replace(/^\.+/, "") ?? "";
  if (
    !LOCAL_DEVELOPMENT_COOKIE_DOMAIN_SUFFIXES.some((suffix) =>
      candidate.endsWith(suffix),
    ) ||
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:test|localhost)$/.test(
      candidate,
    )
  ) {
    return null;
  }
  return candidate;
}

function isHostnameWithinDomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function resolveAuthSessionMode(
  value = process.env.NEXT_PUBLIC_AUTH_SESSION_MODE,
): AuthSessionMode {
  if (value === "compatibility" || value === "platform") return value;
  return value === "legacy" ? "legacy" : "platform";
}

export function legacyCookieNameForSupabaseUrl(supabaseUrl: string): string {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  if (!projectRef) throw new Error("Invalid Supabase project URL.");
  return `sb-${projectRef}-auth-token`;
}

export function isCookieFamily(name: string, storageKey: string): boolean {
  if (name === storageKey) return true;
  if (!name.startsWith(`${storageKey}.`)) return false;
  const suffix = name.slice(storageKey.length + 1);
  return /^(0|[1-9][0-9]*)$/.test(suffix);
}

export function hasCookieFamily(
  cookies: CookieValue[],
  storageKey: string,
): boolean {
  return cookies.some(({ name }) => isCookieFamily(name, storageKey));
}

export function resolveSessionCookieOptions({
  hostname,
  mode = resolveAuthSessionMode(),
  cookieDomain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN,
}: {
  hostname?: string | null;
  mode?: AuthSessionMode;
  cookieDomain?: string | null;
}): SessionCookieOptions | undefined {
  if (mode === "legacy") return undefined;

  const normalizedHostname = normalizeHostname(hostname);
  if (isLocalHostname(normalizedHostname)) {
    return {
      name: LOCAL_SESSION_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  const localDevelopmentDomain = resolveLocalDevelopmentCookieDomain(
    cookieDomain ?? undefined,
  );
  if (
    localDevelopmentDomain?.endsWith(".localhost") &&
    isHostnameWithinDomain(normalizedHostname, localDevelopmentDomain)
  ) {
    return {
      name: LOCAL_SESSION_COOKIE_NAME,
      domain: localDevelopmentDomain,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  const options: SessionCookieOptions = {
    name: PLATFORM_SESSION_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: true,
  };

  if (
    localDevelopmentDomain &&
    isHostnameWithinDomain(normalizedHostname, localDevelopmentDomain)
  ) {
    options.domain = localDevelopmentDomain;
  } else if (TRUSTED_PLATFORM_HOSTS.has(normalizedHostname)) {
    options.domain = PLATFORM_SESSION_COOKIE_DOMAIN;
  }

  return options;
}

export function selectRequestSessionSource({
  mode,
  cookies,
  legacyCookieName,
  platformCookieName,
}: {
  mode: AuthSessionMode;
  cookies: CookieValue[];
  legacyCookieName: string;
  platformCookieName: string;
}): RequestSessionSource {
  if (mode === "legacy") return "legacy";
  if (mode === "platform") return "platform";
  if (hasCookieFamily(cookies, platformCookieName)) return "platform";
  if (hasCookieFamily(cookies, legacyCookieName)) return "promote";
  return "platform";
}

export function hasAuthSessionCookie({
  supabaseUrl,
  hostname,
  mode = resolveAuthSessionMode(),
  cookies,
}: {
  supabaseUrl: string;
  hostname?: string | null;
  mode?: AuthSessionMode;
  cookies: CookieValue[];
}): boolean {
  const legacyCookieName = legacyCookieNameForSupabaseUrl(supabaseUrl);
  const hasLegacy = hasCookieFamily(cookies, legacyCookieName);
  if (mode === "legacy") return hasLegacy;

  const platformCookieOptions = resolveSessionCookieOptions({ hostname, mode });
  const hasPlatform = platformCookieOptions
    ? hasCookieFamily(cookies, platformCookieOptions.name)
    : false;

  return mode === "platform" ? hasPlatform : hasPlatform || hasLegacy;
}
