import type { CookieMethodsServer, CookieOptions } from "@supabase/ssr";

import type {
  ResponseCookieStore,
  ServerCookieStore,
  SupabaseCookie,
} from "./types";

export const PLATFORM_SESSION_COOKIE_NAME = "__Secure-jg-session-v1";
export const PLATFORM_SESSION_COOKIE_DOMAIN = "jayantgoyal.com";
export const STAGING_PLATFORM_SESSION_COOKIE_NAME =
  "__Secure-jg-session-staging-v1";
export const STAGING_PLATFORM_SESSION_COOKIE_DOMAIN = "staging.jayantgoyal.com";
export const LOCAL_PLATFORM_SESSION_COOKIE_NAME = "jg-session-local-v1";
export const PLATFORM_SESSION_COOKIE_MAX_AGE = 34_560_000;

export type PlatformCookiePolicy = Readonly<{
  name: string;
  domain?: string;
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

export const STAGING_PLATFORM_COOKIE_POLICY: PlatformCookiePolicy = {
  ...DEFAULT_PLATFORM_COOKIE_POLICY,
  name: STAGING_PLATFORM_SESSION_COOKIE_NAME,
  domain: STAGING_PLATFORM_SESSION_COOKIE_DOMAIN,
};

export const LOCAL_PLATFORM_COOKIE_POLICY: PlatformCookiePolicy = {
  ...DEFAULT_PLATFORM_COOKIE_POLICY,
  name: LOCAL_PLATFORM_SESSION_COOKIE_NAME,
  domain: undefined,
  secure: false,
};

export type PlatformSessionConfig = Readonly<{
  supabaseUrl: string;
  policy: PlatformCookiePolicy;
}>;

/** Validate the versioned platform-cookie contract without reading a secret. */
export function createPlatformCookiePolicy(
  overrides: Partial<PlatformCookiePolicy> = {},
): PlatformCookiePolicy {
  const policy = { ...DEFAULT_PLATFORM_COOKIE_POLICY, ...overrides };

  if (policy.secure && !policy.name.startsWith("__Secure-")) {
    throw new Error("Secure platform cookies must use a __Secure- name.");
  }
  if (policy.domain) {
    if (
      policy.domain.includes("/") ||
      policy.domain.includes(":") ||
      policy.domain.includes(".") === false
    ) {
      throw new Error("Platform cookie domain must be a bare host name.");
    }
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
  const options: CookieOptions = {
    path: policy.path,
    secure: policy.secure,
    sameSite: policy.sameSite,
    maxAge: policy.maxAge,
  };
  if (policy.domain) options.domain = policy.domain;
  return options;
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, "");
}

/** Resolve the approved cookie contract without trusting arbitrary preview hosts. */
export function platformCookiePolicyForHost(
  hostname: string,
): PlatformCookiePolicy | null {
  const host = normalizeHostname(hostname);

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host === "::1"
  ) {
    return LOCAL_PLATFORM_COOKIE_POLICY;
  }

  if (
    host === STAGING_PLATFORM_SESSION_COOKIE_DOMAIN ||
    host.endsWith(`.${STAGING_PLATFORM_SESSION_COOKIE_DOMAIN}`)
  ) {
    return STAGING_PLATFORM_COOKIE_POLICY;
  }

  if (
    host === PLATFORM_SESSION_COOKIE_DOMAIN ||
    host.endsWith(`.${PLATFORM_SESSION_COOKIE_DOMAIN}`)
  ) {
    return DEFAULT_PLATFORM_COOKIE_POLICY;
  }

  return null;
}

/** Return a session adapter only when the rollout flag and host are approved. */
export function resolvePlatformSessionConfig(input: {
  enabled: boolean;
  hostname: string;
  supabaseUrl: string;
}): PlatformSessionConfig | undefined {
  if (!input.enabled) return undefined;
  const policy = platformCookiePolicyForHost(input.hostname);
  return policy ? { supabaseUrl: input.supabaseUrl, policy } : undefined;
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
    .filter(
      ({ name }) =>
        name === baseName ||
        new RegExp(`^${escapeRegExp(baseName)}\\.\\d+$`).test(name),
    )
    .sort((a, b) => {
      const chunk = (name: string) =>
        name === baseName ? -1 : Number(name.slice(baseName.length + 1));
      return chunk(a.name) - chunk(b.name);
    });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isCookieChunk(name: string, baseName: string): boolean {
  return (
    name === baseName ||
    new RegExp(`^${escapeRegExp(baseName)}\\.\\d+$`).test(name)
  );
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

/** Prefer the versioned platform cookie when both names are present. */
export function normalizeSessionCookies(
  cookies: readonly CookiePair[],
  names: SessionCookieNameSet,
): CookiePair[] {
  const platformChunks = collectCookieChunks(cookies, names.platform);
  if (platformChunks.length === 0) return [...cookies];

  const withoutSessionCookies = cookies.filter(
    ({ name }) =>
      !isCookieChunk(name, names.legacy) &&
      !isCookieChunk(name, names.platform),
  );
  return [
    ...withoutSessionCookies,
    ...renameCookieChunks(platformChunks, names.platform, names.legacy),
  ];
}

function renameCookieName(
  name: string,
  fromBaseName: string,
  toBaseName: string,
): string {
  return name === fromBaseName
    ? toBaseName
    : `${toBaseName}${name.slice(fromBaseName.length)}`;
}

/** Map Supabase's legacy session writes to the versioned platform cookie. */
export function platformizeSessionCookies(
  cookies: readonly SupabaseCookie[],
  config: PlatformSessionConfig,
): SupabaseCookie[] {
  const names = sessionCookieNames(config.supabaseUrl, config.policy);
  const platformOptions = platformCookieOptions(config.policy);

  return cookies.flatMap((cookie) => {
    if (!isCookieChunk(cookie.name, names.legacy)) return [cookie];

    const removing = cookie.value === "" || cookie.options.maxAge === 0;
    const platformCookie: SupabaseCookie = {
      name: renameCookieName(cookie.name, names.legacy, names.platform),
      value: removing ? "" : cookie.value,
      options: {
        ...cookie.options,
        ...platformOptions,
        ...(removing ? { maxAge: 0 } : {}),
      },
    };

    // Keep deletion semantics for the original host-only cookie so the
    // compatibility window cannot leave two valid session names behind.
    const legacyDeletion: SupabaseCookie = {
      name: cookie.name,
      value: "",
      options: { ...cookie.options, maxAge: 0 },
    };

    return [platformCookie, legacyDeletion];
  });
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
  platformSession?: PlatformSessionConfig,
): CookieMethodsServer {
  const names = platformSession
    ? sessionCookieNames(platformSession.supabaseUrl, platformSession.policy)
    : null;

  return {
    getAll: () => {
      const cookies = cookieStore.getAll();
      if (!platformSession || !names) return cookies;
      return Promise.resolve(cookies).then((items) =>
        normalizeSessionCookies(items ?? [], names),
      );
    },
    setAll: (cookiesToSet) => {
      try {
        const writes = platformSession
          ? platformizeSessionCookies(cookiesToSet, platformSession)
          : cookiesToSet;
        writes.forEach(({ name, value, options }) => {
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
  platformSession?: PlatformSessionConfig,
): CookieMethodsServer {
  const names = platformSession
    ? sessionCookieNames(platformSession.supabaseUrl, platformSession.policy)
    : null;

  return {
    getAll: () => {
      const cookies = responseStore.getAll();
      if (!platformSession || !names) return cookies;
      return Promise.resolve(cookies).then((items) =>
        normalizeSessionCookies(items ?? [], names),
      );
    },
    setAll: (cookiesToSet, headers) => {
      const writes = platformSession
        ? platformizeSessionCookies(cookiesToSet, platformSession)
        : cookiesToSet;
      writes.forEach(({ name, value, options }) => {
        responseStore.setCookie(name, value, options);
      });
      Object.entries(headers).forEach(([name, value]) => {
        responseStore.setHeader(name, value);
      });
    },
  };
}
