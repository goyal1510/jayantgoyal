import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AUTH_SURFACE_ROUTES } from "@jayant/web-auth/surface";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceRoot = fileURLToPath(new URL(".", import.meta.url));

const ACTION_FILES = ["entry", "recovery", "account", "mfa", "logout"] as const;

function readActions(): string {
  return ACTION_FILES.map((name) =>
    readFileSync(`${sourceRoot}/app/actions/${name}.ts`, "utf8"),
  ).join("\n");
}

const ROUTE_FILES = new Map<string, string>([
  ["/welcome", "app/welcome/page.tsx"],
  ["/login", "app/login/page.tsx"],
  ["/register", "app/register/page.tsx"],
  ["/forgot-password", "app/forgot-password/page.tsx"],
  ["/reset-password", "app/reset-password/page.tsx"],
  ["/verify", "app/verify/page.tsx"],
  ["/callback", "app/callback/route.ts"],
  ["/mfa", "app/mfa/page.tsx"],
  ["/account/security", "app/account/security/page.tsx"],
  ["/account/providers", "app/account/providers/page.tsx"],
  ["/logout", "app/logout/page.tsx"],
]);

describe("standalone Auth application contract", () => {
  it("owns every canonical account route", () => {
    AUTH_SURFACE_ROUTES.forEach(({ pathname }) => {
      const route = ROUTE_FILES.get(pathname);
      expect(route, pathname).toBeDefined();
      expect(existsSync(`${sourceRoot}/${route}`), pathname).toBe(true);
    });
    expect(existsSync(`${sourceRoot}/app/error/page.tsx`)).toBe(true);
    expect(existsSync(`${sourceRoot}/app/auth/callback/route.ts`)).toBe(true);
    expect(
      existsSync(`${sourceRoot}/app/callback/auth/callback/route.ts`),
    ).toBe(true);
  });

  it("keeps logout as a POST server action rather than a GET route", () => {
    const page = readFileSync(`${sourceRoot}/app/logout/page.tsx`, "utf8");
    const actions = readActions();
    expect(page).toContain("action={logoutAction}");
    expect(actions).toContain("export async function logoutAction");
    expect(page).toContain('name="return_to"');
    expect(actions).toContain("buildSignedOutLoginUrl");
    expect(existsSync(`${sourceRoot}/app/logout/route.ts`)).toBe(false);
  });

  it("keeps profile mutations inside Auth while account deletion stays out of the client app", () => {
    const actions = readActions();
    expect(actions).toContain("export async function updateProfileAction");
    expect(
      existsSync(`${sourceRoot}/components/account/profile-form.tsx`),
    ).toBe(true);
    expect(actions).not.toContain("createSupabaseServiceRoleClient");
  });

  it("verifies Origin for every exported mutation action", () => {
    const actions = readActions();
    const exportedActions =
      actions.match(/export async function \w+Action/g) ?? [];
    const originChecks =
      actions.match(/const context = await actionContext\(\);/g) ?? [];
    expect(exportedActions.length).toBe(18);
    expect(originChecks.length).toBe(15);
    expect(actions.match(/await requireProviderMutation\(/g)).toHaveLength(3);
  });

  it("requires and consumes a verified recovery marker", () => {
    const actions = readActions();
    const callback = readFileSync(
      `${sourceRoot}/app/callback/route.ts`,
      "utf8",
    );
    expect(callback).toContain(
      'response.cookies.set("auth_recovery", "verified"',
    );
    expect(actions).toContain(
      'cookieStore.get("auth_recovery")?.value !== "verified"',
    );
    expect(actions).toContain('cookieStore.delete("auth_recovery")');
  });

  it("keeps the recovery reset form behind the MFA step-up", () => {
    const resetPage = readFileSync(
      `${sourceRoot}/app/reset-password/page.tsx`,
      "utf8",
    );
    const recovery = readFileSync(
      `${sourceRoot}/app/actions/recovery.ts`,
      "utf8",
    );
    expect(resetPage).toContain("getAuthenticatorAssuranceLevel");
    expect(resetPage).toContain("redirect(`/mfa?return_to=");
    expect(recovery).toContain("getAuthenticatorAssuranceLevel");
    expect(recovery).toContain("redirect(`/mfa?return_to=");
  });

  it("clears transient return state when password entry does not need MFA", () => {
    const actions = readActions();
    const actionSupport = readFileSync(
      `${sourceRoot}/lib/auth/action-support.ts`,
      "utf8",
    );
    const mfaPage = readFileSync(`${sourceRoot}/app/mfa/page.tsx`, "utf8");

    expect(actionSupport).toContain("export async function clearReturnTarget");
    expect(actions).toContain("await clearReturnTarget()");
    expect(mfaPage).toContain(
      'params.return_to ?? cookieStore.get("auth_return_to")?.value',
    );
  });

  it("exposes provider management in the visible account navigation", () => {
    const accountLayout = readFileSync(
      `${sourceRoot}/app/account/layout.tsx`,
      "utf8",
    );
    const accountSidebar = readFileSync(
      `${sourceRoot}/components/account/account-sidebar.tsx`,
      "utf8",
    );
    expect(accountLayout).toContain("ApplicationShell");
    expect(accountLayout).toContain("AccountSidebar");
    expect(accountLayout).not.toContain("AccountTopbarUserMenu");
    expect(accountSidebar).toContain('label: "Providers"');
    expect(accountSidebar).toContain('href: "/account/providers"');
    expect(accountSidebar).toContain(
      'pathname.startsWith("/account/providers")',
    );
  });

  it("keeps display names in profiles instead of auth metadata", () => {
    const accountLayout = readFileSync(
      `${sourceRoot}/app/account/layout.tsx`,
      "utf8",
    );
    const studioCallback = readFileSync(
      fileURLToPath(
        new URL(
          "../../../studio/web/src/app/auth/callback/route.ts",
          import.meta.url,
        ),
      ),
      "utf8",
    );
    expect(accountLayout).toContain("profileDisplayName");
    expect(accountLayout).not.toContain("user_metadata");
    expect(studioCallback).not.toContain("user_metadata");
  });

  it("preserves password bytes instead of trimming credentials", () => {
    const actions = readActions();
    expect(actions).toContain(
      'const currentPassword = rawStringField(formData, "current_password")',
    );
    expect(actions.match(/const password = rawStringField/g)).toHaveLength(3);
    expect(actions).not.toContain(
      'const password = stringField(formData, "password")',
    );
  });

  it("does not request a service-role credential", () => {
    const environmentExample = readFileSync(`${appRoot}/.env.example`, "utf8");
    expect(environmentExample).not.toContain("SERVICE_ROLE");
  });

  it("keeps callback failures user-safe and non-cacheable", () => {
    const callback = readFileSync(
      `${sourceRoot}/app/callback/route.ts`,
      "utf8",
    );
    expect(callback).toContain("private, no-store");
    expect(callback).not.toContain("console.");
    expect(callback).not.toContain("error.message");
  });

  it("uses a stricter CSP without analytics or third-party scripts", () => {
    const configuration = readFileSync(`${appRoot}/next.config.ts`, "utf8");
    expect(configuration).toContain("X-Robots-Tag");
    expect(configuration).toContain("Content-Security-Policy");
    expect(configuration).not.toContain("googletagmanager");
    expect(configuration).not.toContain("google-analytics");
  });

  it("serves public landing previews without indexing security routes", () => {
    const homePage = readFileSync(`${sourceRoot}/app/page.tsx`, "utf8");
    const configuration = readFileSync(`${appRoot}/next.config.ts`, "utf8");
    const robots = readFileSync(`${sourceRoot}/app/robots.ts`, "utf8");

    expect(homePage).toContain('if (user) redirect("/account/security")');
    expect(homePage).toContain("<AuthWelcomeShell>");
    expect(homePage).toContain("<WelcomeForm");
    expect(configuration).toContain(
      '{ key: "X-Robots-Tag", value: "index, follow" }',
    );
    expect(configuration).toContain(
      '{ source: "/", headers: publicPreviewHeaders }',
    );
    expect(configuration).toContain(
      '{ source: "/welcome", headers: publicPreviewHeaders }',
    );
    expect(robots).toContain('allow: ["/", "/welcome"]');
    expect(robots).toContain('"/account/"');
    expect(robots).toContain('"/callback"');
  });
});
