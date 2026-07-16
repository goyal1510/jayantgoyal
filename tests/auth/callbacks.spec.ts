import { expect, test } from "@playwright/test";

import { appUrl, authTestEnvironment } from "./support/environment";

test("@read-only Main callback rejects a request with no credential", async ({
  page,
}) => {
  await page.goto(appUrl(authTestEnvironment.mainBaseUrl, "/auth/callback"));
  expect(new URL(page.url()).pathname).toBe("/welcome");
});

test("@read-only Main callback rejects an invalid PKCE code", async ({
  page,
}) => {
  await page.goto(
    appUrl(
      authTestEnvironment.mainBaseUrl,
      "/auth/callback?code=not-a-real-pkce-code",
    ),
  );
  expect(new URL(page.url()).pathname).toBe("/welcome");
});

test("@read-only recovery callback keeps invalid or expired links recoverable", async ({
  page,
}) => {
  await page.goto(
    appUrl(
      authTestEnvironment.mainBaseUrl,
      "/auth/callback?token_hash=not-a-real-recovery-token&type=recovery",
    ),
  );
  expect(new URL(page.url()).pathname).toBe("/welcome");
  await expect(
    page.getByRole("heading", { name: "Welcome!", exact: true }),
  ).toBeVisible();
});

test("@read-only Admin callback rejects missing and invalid codes", async ({
  page,
}) => {
  await page.goto(appUrl(authTestEnvironment.adminBaseUrl, "/auth/callback"));
  expect(new URL(page.url()).pathname).toBe("/welcome");

  await page.goto(
    appUrl(
      authTestEnvironment.adminBaseUrl,
      "/auth/callback?code=not-a-real-pkce-code",
    ),
  );
  expect(new URL(page.url()).pathname).toBe("/welcome");
});
