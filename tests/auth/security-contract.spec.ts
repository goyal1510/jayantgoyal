import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

function source(relativePath: string) {
  return readFileSync(path.resolve(process.cwd(), relativePath), "utf8");
}

test("@read-only auth tests contain no credential or token literals", () => {
  const files = [
    "tests/auth/.env.test.example",
    "tests/auth/account-endpoints.spec.ts",
    "tests/auth/authenticated.spec.ts",
    "tests/auth/callbacks.spec.ts",
    "tests/auth/public.spec.ts",
    "tests/auth/support/auth-flow.ts",
    "tests/auth/support/environment.ts",
    "tests/auth/support/totp.ts",
  ];
  const content = files.map(source).join("\n");

  expect(content).not.toMatch(/-----BEGIN .*PRIVATE KEY-----/);
  expect(content).not.toMatch(/\beyJ[A-Za-z0-9_-]{20,}\./);
  expect(content).not.toMatch(
    /\b(?:ghp|github_pat|sk_live|sk_test)_[A-Za-z0-9_-]{12,}/,
  );
  expect(content).not.toMatch(
    /[A-Z0-9._%+-]+@(?!example\.com)[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );
});

test("@read-only browser and Admin routes do not expose service-role construction", () => {
  expect(source("apps/jayantgoyal/src/lib/supabase/client.ts")).not.toContain(
    '"@repo/auth/admin"',
  );
  expect(source("apps/admin/src/lib/supabase/client.ts")).not.toContain(
    '"@repo/auth/admin"',
  );

  const adminRoutes = [
    "apps/admin/src/app/api/account/delete/route.ts",
    "apps/admin/src/app/api/users/route.ts",
    "apps/admin/src/app/api/portfolio/[table]/helpers.ts",
  ];
  for (const file of adminRoutes) {
    expect(source(file)).not.toContain('from "@supabase/supabase-js"');
    expect(source(file)).toContain("createSupabaseAdminClient");
  }
});

test("@read-only known gap: Admin callback rejects external return destinations", () => {
  test.fail(true, "PLATFORM-00 proved the current Admin callback is open.");
  const callback = source("apps/admin/src/app/auth/callback/route.ts");
  expect(callback).not.toContain(
    "const redirectUrl = new URL(next, request.url)",
  );
});

test("@read-only known gap: Admin requires AAL2 even without an enrolled factor", () => {
  test.fail(true, "PLATFORM-00 proved factorless Admin AAL1 access.");
  const proxy = source("apps/admin/src/proxy.ts");
  expect(proxy).not.toContain("if (hasVerifiedFactor) {");
});

test("@read-only known gap: default visible logout is explicit current-session scope", () => {
  test.fail(
    true,
    "Current visible logout relies on Supabase's implicit global scope.",
  );
  const mainLogout = source(
    "apps/jayantgoyal/src/components/sidebar/nav-user.tsx",
  );
  const adminLogout = source("apps/admin/src/components/sidebar/nav-user.tsx");
  expect(mainLogout).toContain('signOut({ scope: "local" })');
  expect(adminLogout).toContain('signOut({ scope: "local" })');
});

test("@read-only SSR cookie writers propagate private cache headers", () => {
  const appFiles = [
    "apps/jayantgoyal/src/proxy.ts",
    "apps/admin/src/proxy.ts",
    "apps/jayantgoyal/src/app/auth/callback/route.ts",
    "apps/admin/src/app/auth/callback/route.ts",
  ];

  for (const file of appFiles) {
    const content = source(file);
    expect(content).toContain('"@repo/auth/proxy"');
  }

  const sharedCookies = source("packages/auth/src/cookies.ts");
  expect(sharedCookies).toMatch(/setAll[^\n]*headers/);
  expect(sharedCookies).toContain("Object.entries(headers)");
  expect(sharedCookies).toContain("responseStore.setHeader(name, value)");

  expect(source("apps/jayantgoyal/src/app/auth/callback/route.ts")).toContain(
    'if (name !== "location") target.headers.set(name, value)',
  );
  expect(source("apps/admin/src/app/auth/callback/route.ts")).toContain(
    'if (name !== "location") target.headers.set(name, value)',
  );
});
