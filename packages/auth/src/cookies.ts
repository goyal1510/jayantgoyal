import type { CookieMethodsServer, CookieOptions } from "@supabase/ssr";

import type { ResponseCookieStore, ServerCookieStore } from "./types";

export const PLATFORM_SESSION_COOKIE_NAME = "__Secure-jg-session-v1";
export const PLATFORM_SESSION_COOKIE_DOMAIN = "jayantgoyal.com";
export const PLATFORM_SESSION_COOKIE_MAX_AGE = 34_560_000;

export type PlatformCookiePolicy = Readonly<{
  name: string;
  domain: string;
  path: string;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  maxAge: number;
}>;

export const DEFAULT_PLATFORM_COOKIE_POLICY: PlatformCookiePolicy = {
  name: PLATFORM_SESSION_COOKIE_NAME,
  domain: PLATFORM_SESSION_COOKIE_DOMAIN,
  path: "/",
  secure: true,
  sameSite: "lax",
  maxAge: PLATFORM_SESSION_COOKIE_MAX_AGE,
};

/** Validate the versioned platform-cookie contract without reading a secret. */
export function createPlatformCookiePolicy(
  overrides: Partial<PlatformCookiePolicy> = {},
): PlatformCookiePolicy {
  const policy = { ...DEFAULT_PLATFORM_COOKIE_POLICY, ...overrides };

  if (policy.secure && !policy.name.startsWith("__Secure-")) {
    throw new Error("Secure platform cookies must use a __Secure- name.");
  }
  if (
    !policy.domain ||
    policy.domain.includes("/") ||
    policy.domain.includes(":") ||
    policy.domain.includes(".") === false
  ) {
    throw new Error("Platform cookie domain must be a bare host name.");
  }
  if (policy.path !== "/") {
    throw new Error("Platform session cookies must use Path=/.");
  }
  if (policy.maxAge <= 0 || !Number.isInteger(policy.maxAge)) {
    throw new Error(
      "Platform session cookie maxAge must be a positive integer.",
    );
  }

  return policy;
}

export function platformCookieOptions(
  policy: PlatformCookiePolicy = DEFAULT_PLATFORM_COOKIE_POLICY,
): CookieOptions {
  return {
    domain: policy.domain,
    path: policy.path,
    secure: policy.secure,
    sameSite: policy.sameSite,
    maxAge: policy.maxAge,
  };
}

export function legacySupabaseCookieName(supabaseUrl: string): string {
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  if (!projectRef) throw new Error("Supabase URL has no project reference.");
  return `sb-${projectRef}-auth-token`;
}

export type SessionCookieNameSet = Readonly<{
  legacy: string;
  platform: string;
}>;

export function sessionCookieNames(
  supabaseUrl: string,
  policy: PlatformCookiePolicy = DEFAULT_PLATFORM_COOKIE_POLICY,
): SessionCookieNameSet {
  return {
    legacy: legacySupabaseCookieName(supabaseUrl),
    platform: policy.name,
  };
}

export type CookiePair = Readonly<{ name: string; value: string }>;

/** Return a base cookie and numeric chunks in deterministic order. */
export function collectCookieChunks(
  cookies: readonly CookiePair[],
  baseName: string,
): CookiePair[] {
  return cookies
    .filter(({ name }) => name === baseName || name.startsWith(`${baseName}.`))
    .sort((a, b) => {
      const chunk = (name: string) =>
        name === baseName ? -1 : Number(name.slice(baseName.length + 1));
      return chunk(a.name) - chunk(b.name);
    });
}

export function renameCookieChunks(
  cookies: readonly CookiePair[],
  fromBaseName: string,
  toBaseName: string,
): CookiePair[] {
  return cookies.map(({ name, value }) => ({
    name:
      name === fromBaseName
        ? toBaseName
        : `${toBaseName}${name.slice(fromBaseName.length)}`,
    value,
  }));
}

export function shouldPromoteLegacySession(input: {
  enabled: boolean;
  validatedSession: boolean;
  hasPlatformCookie: boolean;
}): boolean {
  return input.enabled && input.validatedSession && !input.hasPlatformCookie;
}

/**
 * Adapt a framework request cookie store for page/server Supabase clients.
 * Response headers are intentionally ignored here because Next's page cookie
 * store cannot mutate response headers; middleware owns response promotion.
 */
export function createServerCookieMethods(
  cookieStore: ServerCookieStore,
): CookieMethodsServer {
  return {
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // The cookies API can be read-only in edge/server-component contexts.
      }
    },
  };
}

/** Adapt middleware/route response cookies and cache-control headers. */
export function createResponseCookieMethods(
  responseStore: ResponseCookieStore,
): CookieMethodsServer {
  return {
    getAll: () => responseStore.getAll(),
    setAll: (cookiesToSet, headers) => {
      cookiesToSet.forEach(({ name, value, options }) => {
        responseStore.setCookie(name, value, options);
      });
      Object.entries(headers).forEach(([name, value]) => {
        responseStore.setHeader(name, value);
      });
    },
  };
}
