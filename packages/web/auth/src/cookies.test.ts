import { describe, expect, it } from "vitest";

import {
  LOCAL_SESSION_COOKIE_NAME,
  PLATFORM_SESSION_COOKIE_DOMAIN,
  PLATFORM_SESSION_COOKIE_NAME,
  hasAuthSessionCookie,
  hasCookieFamily,
  isCookieFamily,
  legacyCookieNameForSupabaseUrl,
  resolveAuthSessionMode,
  resolveLocalDevelopmentCookieDomain,
  resolveSessionCookieOptions,
  selectRequestSessionSource,
} from "./cookies";

describe("auth session mode", () => {
  it.each([undefined, "", "invalid"])(
    "defaults %s to the shared platform cookie mode",
    (value) => {
      expect(resolveAuthSessionMode(value)).toBe("platform");
    },
  );

  it("keeps legacy mode available only as an explicit rollback", () => {
    expect(resolveAuthSessionMode("legacy")).toBe("legacy");
  });

  it.each(["compatibility", "platform"] as const)(
    "accepts %s mode",
    (value) => {
      expect(resolveAuthSessionMode(value)).toBe(value);
    },
  );
});

describe("session cookie policy", () => {
  it("accepts only reserved local development parent domains", () => {
    expect(resolveLocalDevelopmentCookieDomain(".jayantgoyal.test")).toBe(
      "jayantgoyal.test",
    );
    expect(resolveLocalDevelopmentCookieDomain("jayantgoyal.localhost")).toBe(
      "jayantgoyal.localhost",
    );
    expect(resolveLocalDevelopmentCookieDomain("jayantgoyal.com")).toBeNull();
    expect(resolveLocalDevelopmentCookieDomain("localhost")).toBeNull();
    expect(
      resolveLocalDevelopmentCookieDomain("jayantgoyal.test.evil.example"),
    ).toBeNull();
  });

  it("does not override the current cookie in legacy mode", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "studio.jayantgoyal.com",
        mode: "legacy",
      }),
    ).toBeUndefined();
  });

  it("uses the approved parent-domain contract on trusted production hosts", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "admin.jayantgoyal.com",
        mode: "compatibility",
      }),
    ).toEqual({
      name: PLATFORM_SESSION_COOKIE_NAME,
      domain: PLATFORM_SESSION_COOKIE_DOMAIN,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("uses an unprefixed host-only cookie across localhost ports", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "localhost:3001",
        mode: "compatibility",
      }),
    ).toEqual({
      name: LOCAL_SESSION_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
    expect(
      resolveSessionCookieOptions({
        hostname: "[::1]:3002",
        mode: "compatibility",
      }),
    ).toEqual({
      name: LOCAL_SESSION_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  it("keeps generated Preview cookies secure and host-only", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "jayantgoyal-studio-git-feature.vercel.app",
        mode: "compatibility",
      }),
    ).toEqual({
      name: PLATFORM_SESSION_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("uses a secure shared cookie on the configured local test domain", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "auth.jayantgoyal.test",
        mode: "compatibility",
        cookieDomain: "jayantgoyal.test",
      }),
    ).toEqual({
      name: PLATFORM_SESSION_COOKIE_NAME,
      domain: "jayantgoyal.test",
      path: "/",
      sameSite: "lax",
      secure: true,
    });
  });

  it("uses an unprefixed shared cookie across localhost subdomains", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "studio.jayantgoyal.localhost",
        mode: "compatibility",
        cookieDomain: "jayantgoyal.localhost",
      }),
    ).toEqual({
      name: LOCAL_SESSION_COOKIE_NAME,
      domain: "jayantgoyal.localhost",
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  });

  it("does not grant an unrelated test hostname the configured parent cookie", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "auth.other.test",
        mode: "compatibility",
        cookieDomain: "jayantgoyal.test",
      }),
    ).not.toHaveProperty("domain");
  });

  it("does not grant an unknown platform subdomain the parent cookie", () => {
    expect(
      resolveSessionCookieOptions({
        hostname: "unknown.jayantgoyal.com",
        mode: "compatibility",
      }),
    ).not.toHaveProperty("domain");
  });
});

describe("legacy cookie discovery and selection", () => {
  const legacyName = "sb-project-ref-auth-token";

  it("derives the current Supabase storage key", () => {
    expect(
      legacyCookieNameForSupabaseUrl("https://project-ref.supabase.co"),
    ).toBe(legacyName);
  });

  it.each([
    [legacyName, true],
    [`${legacyName}.0`, true],
    [`${legacyName}.12`, true],
    [`${legacyName}.01`, false],
    [`${legacyName}.user`, false],
    [`other.${legacyName}.0`, false],
  ])("classifies cookie family member %s", (name, expected) => {
    expect(isCookieFamily(name, legacyName)).toBe(expected);
  });

  it("finds chunked cookies without inspecting their values", () => {
    expect(
      hasCookieFamily(
        [{ name: `${legacyName}.0`, value: "synthetic" }],
        legacyName,
      ),
    ).toBe(true);
  });

  it("prefers the platform cookie when both names exist", () => {
    expect(
      selectRequestSessionSource({
        mode: "compatibility",
        cookies: [
          { name: legacyName, value: "legacy" },
          { name: `${PLATFORM_SESSION_COOKIE_NAME}.0`, value: "platform" },
        ],
        legacyCookieName: legacyName,
        platformCookieName: PLATFORM_SESSION_COOKIE_NAME,
      }),
    ).toBe("platform");
  });

  it("promotes only when compatibility mode sees legacy state alone", () => {
    expect(
      selectRequestSessionSource({
        mode: "compatibility",
        cookies: [{ name: `${legacyName}.0`, value: "synthetic" }],
        legacyCookieName: legacyName,
        platformCookieName: PLATFORM_SESSION_COOKIE_NAME,
      }),
    ).toBe("promote");
  });

  it("uses the explicit source in legacy and platform modes", () => {
    const cookies = [{ name: legacyName, value: "synthetic" }];
    expect(
      selectRequestSessionSource({
        mode: "legacy",
        cookies,
        legacyCookieName: legacyName,
        platformCookieName: PLATFORM_SESSION_COOKIE_NAME,
      }),
    ).toBe("legacy");
    expect(
      selectRequestSessionSource({
        mode: "platform",
        cookies,
        legacyCookieName: legacyName,
        platformCookieName: PLATFORM_SESSION_COOKIE_NAME,
      }),
    ).toBe("platform");
  });

  it("detects the cookie families allowed by each rollout mode", () => {
    const legacyCookies = [{ name: `${legacyName}.0`, value: "synthetic" }];
    const platformCookies = [
      { name: PLATFORM_SESSION_COOKIE_NAME, value: "synthetic" },
    ];
    const common = {
      supabaseUrl: "https://project-ref.supabase.co",
      hostname: "studio.jayantgoyal.com",
    };

    expect(
      hasAuthSessionCookie({
        ...common,
        mode: "legacy",
        cookies: legacyCookies,
      }),
    ).toBe(true);
    expect(
      hasAuthSessionCookie({
        ...common,
        mode: "legacy",
        cookies: platformCookies,
      }),
    ).toBe(false);
    expect(
      hasAuthSessionCookie({
        ...common,
        mode: "compatibility",
        cookies: legacyCookies,
      }),
    ).toBe(true);
    expect(
      hasAuthSessionCookie({
        ...common,
        mode: "compatibility",
        cookies: platformCookies,
      }),
    ).toBe(true);
    expect(
      hasAuthSessionCookie({
        ...common,
        mode: "platform",
        cookies: legacyCookies,
      }),
    ).toBe(false);
  });
});
