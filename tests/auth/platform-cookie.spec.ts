import { expect, test } from "@playwright/test";

import {
  DEFAULT_PLATFORM_COOKIE_POLICY,
  LOCAL_PLATFORM_COOKIE_POLICY,
  STAGING_PLATFORM_COOKIE_POLICY,
  collectCookieChunks,
  createPlatformCookiePolicy,
  legacySupabaseCookieName,
  normalizeSessionCookies,
  platformCookieOptions,
  platformCookiePolicyForHost,
  platformizeSessionCookies,
  renameCookieChunks,
  resolvePlatformSessionConfig,
  sessionCookieNames,
  shouldPromoteLegacySession,
} from "../../packages/auth/src/cookies";

test("@read-only versioned platform cookie policy keeps the approved attributes", () => {
  expect(DEFAULT_PLATFORM_COOKIE_POLICY).toMatchObject({
    name: "__Secure-jg-session-v1",
    domain: "jayantgoyal.com",
    path: "/",
    secure: true,
    sameSite: "lax",
  });
  expect(platformCookieOptions()).toMatchObject({
    domain: "jayantgoyal.com",
    path: "/",
    secure: true,
    sameSite: "lax",
  });
});

test("@read-only legacy and platform cookie names remain distinct", () => {
  const legacy = legacySupabaseCookieName(
    "https://orwfvyditlguqvxvztkw.supabase.co",
  );
  expect(legacy).toBe("sb-orwfvyditlguqvxvztkw-auth-token");
  expect(
    sessionCookieNames("https://orwfvyditlguqvxvztkw.supabase.co"),
  ).toEqual({
    legacy,
    platform: "__Secure-jg-session-v1",
  });
  expect(legacy).not.toBe(DEFAULT_PLATFORM_COOKIE_POLICY.name);
});

test("@read-only session chunks sort and rename without changing values", () => {
  const cookies = [
    { name: "unrelated", value: "ignored" },
    { name: "sb-example-auth-token.2", value: "chunk-two" },
    { name: "sb-example-auth-token", value: "chunk-zero" },
    { name: "sb-example-auth-token.1", value: "chunk-one" },
  ];
  const chunks = collectCookieChunks(cookies, "sb-example-auth-token");
  expect(chunks.map(({ name }) => name)).toEqual([
    "sb-example-auth-token",
    "sb-example-auth-token.1",
    "sb-example-auth-token.2",
  ]);
  expect(
    renameCookieChunks(
      chunks,
      "sb-example-auth-token",
      "__Secure-jg-session-v1",
    ),
  ).toEqual([
    { name: "__Secure-jg-session-v1", value: "chunk-zero" },
    { name: "__Secure-jg-session-v1.1", value: "chunk-one" },
    { name: "__Secure-jg-session-v1.2", value: "chunk-two" },
  ]);
});

test("@read-only legacy promotion requires an enabled flag and validated session", () => {
  expect(
    shouldPromoteLegacySession({
      enabled: false,
      validatedSession: true,
      hasPlatformCookie: false,
    }),
  ).toBe(false);
  expect(
    shouldPromoteLegacySession({
      enabled: true,
      validatedSession: false,
      hasPlatformCookie: false,
    }),
  ).toBe(false);
  expect(
    shouldPromoteLegacySession({
      enabled: true,
      validatedSession: true,
      hasPlatformCookie: true,
    }),
  ).toBe(false);
  expect(
    shouldPromoteLegacySession({
      enabled: true,
      validatedSession: true,
      hasPlatformCookie: false,
    }),
  ).toBe(true);
});

test("@read-only platform cookie policy rejects unsafe overrides", () => {
  expect(() =>
    createPlatformCookiePolicy({ name: "session", secure: true }),
  ).toThrow();
  expect(() =>
    createPlatformCookiePolicy({ domain: "https://jayantgoyal.com" }),
  ).toThrow();
  expect(() => createPlatformCookiePolicy({ path: "/auth" })).toThrow();
});

test("@read-only platform policy is host-scoped and preview-safe", () => {
  expect(platformCookiePolicyForHost("auth.jayantgoyal.com")).toEqual(
    DEFAULT_PLATFORM_COOKIE_POLICY,
  );
  expect(platformCookiePolicyForHost("auth.staging.jayantgoyal.com")).toEqual(
    STAGING_PLATFORM_COOKIE_POLICY,
  );
  expect(platformCookiePolicyForHost("localhost")).toEqual(
    LOCAL_PLATFORM_COOKIE_POLICY,
  );
  expect(
    platformCookiePolicyForHost("jayantgoyal-git-preview.vercel.app"),
  ).toBe(null);
  expect(
    resolvePlatformSessionConfig({
      enabled: false,
      hostname: "auth.jayantgoyal.com",
      supabaseUrl: "https://orwfvyditlguqvxvztkw.supabase.co",
    }),
  ).toBeUndefined();
  expect(
    resolvePlatformSessionConfig({
      enabled: true,
      hostname: "jayantgoyal-git-preview.vercel.app",
      supabaseUrl: "https://orwfvyditlguqvxvztkw.supabase.co",
    }),
  ).toBeUndefined();
});

test("@read-only platform cookies take precedence over legacy chunks", () => {
  const names = sessionCookieNames(
    "https://orwfvyditlguqvxvztkw.supabase.co",
    STAGING_PLATFORM_COOKIE_POLICY,
  );
  expect(
    normalizeSessionCookies(
      [
        { name: names.legacy, value: "legacy" },
        { name: names.platform, value: "platform-zero" },
        { name: `${names.platform}.1`, value: "platform-one" },
        { name: "unrelated", value: "keep" },
      ],
      names,
    ),
  ).toEqual([
    { name: "unrelated", value: "keep" },
    { name: names.legacy, value: "platform-zero" },
    { name: `${names.legacy}.1`, value: "platform-one" },
  ]);
});

test("@read-only platform writes set the parent cookie and delete legacy chunks", () => {
  const config = {
    supabaseUrl: "https://orwfvyditlguqvxvztkw.supabase.co",
    policy: STAGING_PLATFORM_COOKIE_POLICY,
  };
  const names = sessionCookieNames(config.supabaseUrl, config.policy);
  expect(
    platformizeSessionCookies(
      [
        {
          name: names.legacy,
          value: "opaque-session",
          options: { path: "/", maxAge: 3600 },
        },
        {
          name: `${names.legacy}.1`,
          value: "opaque-session-chunk",
          options: { path: "/", maxAge: 3600 },
        },
        {
          name: "sb-orwfvyditlguqvxvztkw-auth-token-code-verifier",
          value: "verifier",
          options: { path: "/", maxAge: 600 },
        },
      ],
      config,
    ),
  ).toEqual([
    {
      name: names.platform,
      value: "opaque-session",
      options: {
        path: "/",
        maxAge: config.policy.maxAge,
        secure: true,
        sameSite: "lax",
        domain: config.policy.domain,
      },
    },
    {
      name: names.legacy,
      value: "",
      options: { path: "/", maxAge: 0 },
    },
    {
      name: `${names.platform}.1`,
      value: "opaque-session-chunk",
      options: {
        path: "/",
        maxAge: config.policy.maxAge,
        secure: true,
        sameSite: "lax",
        domain: config.policy.domain,
      },
    },
    {
      name: `${names.legacy}.1`,
      value: "",
      options: { path: "/", maxAge: 0 },
    },
    {
      name: "sb-orwfvyditlguqvxvztkw-auth-token-code-verifier",
      value: "verifier",
      options: { path: "/", maxAge: 600 },
    },
  ]);
});
