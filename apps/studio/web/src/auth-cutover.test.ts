import { NextRequest } from "next/server";
import { existsSync, readFileSync } from "node:fs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import studioProxy from "./proxy";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_URL", "https://auth.jayantgoyal.com");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe("Studio Auth entry cutover", () => {
  it("switches account navigation through the shared owner contract", () => {
    const topbar = readFileSync(
      new URL("./components/header/topbar-user-menu.tsx", import.meta.url),
      "utf8",
    );
    expect(topbar).toContain("buildAuthAccountSecurityUrl");
    expect(topbar).toContain("buildAuthLogoutUrl");
    expect(topbar).not.toContain("AccountSettingsSheet");
    expect(
      existsSync(new URL("./components/sidebar/nav-user.tsx", import.meta.url)),
    ).toBe(false);
  });

  it("keeps duplicated account and entry implementations removed", () => {
    expect(
      existsSync(
        new URL(
          "./components/sidebar/account-settings-sheet.tsx",
          import.meta.url,
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("./components/auth/mfa-settings-section.tsx", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("./app/api/account/mfa-cleanup/route.ts", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(new URL("./app/api/account/delete/route.ts", import.meta.url)),
    ).toBe(true);
    expect(
      existsSync(
        new URL("./components/auth/welcome-form.tsx", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("./components/auth/forgot-password-form.tsx", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("./components/auth/mfa-verify-step.tsx", import.meta.url),
      ),
    ).toBe(false);
  });

  it("keeps the protected layout on the shared session-cookie contract", () => {
    const layout = readFileSync(
      new URL("./app/(protected)/layout.tsx", import.meta.url),
      "utf8",
    );

    expect(layout).toContain("hasAuthSessionCookie");
    expect(layout).toContain("resolveAuthSessionMode");
    expect(layout).not.toContain("sb-${projectRef}-auth-token");
  });

  it("preserves the full gated product destination through the entry alias", () => {
    const authGate = readFileSync(
      new URL("./components/auth/auth-gate.tsx", import.meta.url),
      "utf8",
    );

    expect(authGate).toContain("useSearchParams");
    expect(authGate).toContain(
      'const returnPath = `${pathname}${query ? `?${query}` : ""}`',
    );
    expect(authGate).toContain("encodeURIComponent(returnPath)");
  });

  it("keeps product entry aliases as redirects rather than local forms", () => {
    const welcomePage = readFileSync(
      new URL("./app/welcome/page.tsx", import.meta.url),
      "utf8",
    );
    const forgotPasswordPage = readFileSync(
      new URL("./app/forgot-password/page.tsx", import.meta.url),
      "utf8",
    );
    const mfaPage = readFileSync(
      new URL("./app/mfa-verify/page.tsx", import.meta.url),
      "utf8",
    );

    expect(welcomePage).toContain("buildAuthLoginUrl");
    expect(welcomePage).not.toContain("WelcomeForm");
    expect(forgotPasswordPage).toContain("buildAuthForgotPasswordUrl");
    expect(mfaPage).toContain("buildAuthMfaUrl");
  });

  it("routes login entry to Auth with an exact Studio return target", async () => {
    const response = await studioProxy(
      new NextRequest(
        "https://studio.jayantgoyal.com/welcome?redirect=%2Ffiles",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/welcome?return_to=https%3A%2F%2Fstudio.jayantgoyal.com%2Ffiles",
    );
  });

  it("routes recovery and MFA aliases to Auth", async () => {
    const [recovery, mfa] = await Promise.all([
      studioProxy(
        new NextRequest("https://studio.jayantgoyal.com/forgot-password"),
      ),
      studioProxy(
        new NextRequest(
          "https://studio.jayantgoyal.com/mfa-verify?redirect=%2Ffiles%3Ffolder%3Done",
        ),
      ),
    ]);

    expect(recovery.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/forgot-password",
    );
    expect(mfa.headers.get("location")).toBe(
      "https://auth.jayantgoyal.com/mfa?return_to=https%3A%2F%2Fstudio.jayantgoyal.com%2Ffiles%3Ffolder%3Done",
    );
  });
});
