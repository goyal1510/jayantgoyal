import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { AUTH_SURFACE_ROUTES } from "@repo/auth/surface";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceRoot = fileURLToPath(new URL(".", import.meta.url));

const ACTION_FILES = ["entry", "recovery", "account", "mfa", "logout"] as const;

function readActions(): string {
  return ACTION_FILES.map((name) =>
    readFileSync(`${sourceRoot}/app/actions/${name}.ts`, "utf8"),
  ).join("\n");
}

const ROUTE_FILES = new Map<string, string>([
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
  it("owns every approved dark-launch route", () => {
    AUTH_SURFACE_ROUTES.forEach(({ pathname }) => {
      const route = ROUTE_FILES.get(pathname);
      expect(route, pathname).toBeDefined();
      expect(existsSync(`${sourceRoot}/${route}`), pathname).toBe(true);
    });
    expect(existsSync(`${sourceRoot}/app/error/page.tsx`)).toBe(true);
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
    expect(exportedActions.length).toBe(15);
    expect(originChecks.length).toBe(14);
    expect(actions.match(/await requireProviderMutation\(/g)).toHaveLength(2);
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

  it("preserves password bytes instead of trimming credentials", () => {
    const actions = readActions();
    expect(actions).toContain(
      'const currentPassword = rawStringField(formData, "current_password")',
    );
    expect(actions.match(/const password = rawStringField/g)).toHaveLength(4);
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
});
