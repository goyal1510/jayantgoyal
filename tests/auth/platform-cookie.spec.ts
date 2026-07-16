import { expect, test } from "@playwright/test";

import {
  DEFAULT_PLATFORM_COOKIE_POLICY,
  collectCookieChunks,
  createPlatformCookiePolicy,
  legacySupabaseCookieName,
  platformCookieOptions,
  renameCookieChunks,
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
