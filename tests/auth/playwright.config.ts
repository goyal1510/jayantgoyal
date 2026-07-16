import { defineConfig } from "@playwright/test";

import { authTestEnvironment } from "./support/environment";

const webServer = authTestEnvironment.external
  ? undefined
  : [
      {
        command:
          "pnpm --dir ../../apps/jayantgoyal exec next dev --webpack --port 3000",
        url: `${authTestEnvironment.mainBaseUrl}/welcome`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
      {
        command:
          "pnpm --dir ../../apps/admin exec next dev --webpack --port 3001",
        url: `${authTestEnvironment.adminBaseUrl}/welcome`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
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
