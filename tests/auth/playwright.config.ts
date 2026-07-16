import { defineConfig } from "@playwright/test";

import { authTestEnvironment } from "./support/environment";

const webServer = authTestEnvironment.external
  ? undefined
  : [
      ...(authTestEnvironment.fakeSupabase
        ? [
            {
              command: "node support/fake-supabase-server.mjs",
              url: `${authTestEnvironment.supabaseBaseUrl}/health`,
              reuseExistingServer: !process.env.CI,
              timeout: 30_000,
            },
          ]
        : []),
      {
        command:
          "pnpm --dir ../../apps/jayantgoyal exec next dev --webpack --port 3000",
        url: `${authTestEnvironment.mainBaseUrl}/welcome`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: authTestEnvironment.supabaseBaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: authTestEnvironment.supabaseAnonKey,
          SUPABASE_SERVICE_ROLE_KEY: authTestEnvironment.supabaseServiceRoleKey,
          NEXT_PUBLIC_SITE_URL: authTestEnvironment.mainBaseUrl,
        },
      },
      {
        command:
          "pnpm --dir ../../apps/admin exec next dev --webpack --port 3001",
        url: `${authTestEnvironment.adminBaseUrl}/welcome`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: authTestEnvironment.supabaseBaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: authTestEnvironment.supabaseAnonKey,
          SUPABASE_SERVICE_ROLE_KEY: authTestEnvironment.supabaseServiceRoleKey,
          NEXT_PUBLIC_SITE_URL: authTestEnvironment.adminBaseUrl,
        },
      },
    ];

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  outputDir: "../../test-results/auth",
  preserveOutput: "never",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  reporter: [["line"]],
  webServer,
  use: {
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
    screenshot: "off",
    trace: "off",
    video: "off",
  },
});
