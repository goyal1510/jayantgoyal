import { expect, test } from "@playwright/test";

import { appUrl, authTestEnvironment } from "./support/environment";

test("@read-only @local-oauth Main Google callback works without a provider UI", async ({
  page,
}) => {
  test.skip(
    !authTestEnvironment.fakeSupabase,
    "The loopback OAuth fixture is only enabled for local auth runs.",
  );

  await page.goto(appUrl(authTestEnvironment.mainBaseUrl, "/welcome"));
  await page.getByRole("button", { name: "Continue with Google" }).click();

  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 20_000 })
    .toBe("/");
});

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
