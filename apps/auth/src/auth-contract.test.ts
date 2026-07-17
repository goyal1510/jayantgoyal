import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceRoot = fileURLToPath(new URL(".", import.meta.url));

const ACTION_FILES = ["entry", "recovery", "account", "mfa", "logout"] as const;

function readActions(): string {
  return ACTION_FILES.map((name) =>
    readFileSync(`${sourceRoot}/app/actions/${name}.ts`, "utf8"),
  ).join("\n");
}

const ROUTES = [
  "app/login/page.tsx",
  "app/register/page.tsx",
  "app/forgot-password/page.tsx",
  "app/reset-password/page.tsx",
  "app/verify/page.tsx",
  "app/callback/route.ts",
  "app/mfa/page.tsx",
  "app/account/security/page.tsx",
  "app/account/providers/page.tsx",
  "app/logout/page.tsx",
  "app/error/page.tsx",
] as const;

describe("standalone Auth application contract", () => {
  it("owns every approved dark-launch route", () => {
    ROUTES.forEach((route) => {
      expect(existsSync(`${sourceRoot}/${route}`), route).toBe(true);
    });
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

  it("verifies Origin for every exported mutation action", () => {
    const actions = readActions();
    const exportedActions =
      actions.match(/export async function \w+Action/g) ?? [];
    const originChecks =
      actions.match(/const context = await actionContext\(\);/g) ?? [];
    expect(exportedActions.length).toBe(14);
    expect(originChecks.length).toBe(13);
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
