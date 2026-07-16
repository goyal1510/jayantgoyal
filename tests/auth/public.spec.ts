import { expect, test } from "@playwright/test";

import { appUrl, authTestEnvironment } from "./support/environment";

const CURRENT_COOKIE_NAME = "sb-orwfvyditlguqvxvztkw-auth-token";

function expiredSessionCookie() {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const accessToken = `${encode({ alg: "none", typ: "JWT" })}.${encode({
    aal: "aal1",
    exp: 1,
    role: "authenticated",
    sub: "00000000-0000-0000-0000-000000000000",
  })}.invalid`;

  return `base64-${Buffer.from(
    JSON.stringify({
      access_token: accessToken,
      expires_at: 1,
      expires_in: 0,
      refresh_token: "invalid-refresh-token",
      token_type: "bearer",
      user: null,
    }),
  ).toString("base64")}`;
}

test("@read-only public Portfolio renders without authentication", async ({
  page,
}) => {
  const response = await page.goto(authTestEnvironment.mainBaseUrl);
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator("main")).toBeVisible();
  await expect(page).toHaveTitle(/Jayant Goyal/);
});

test("@read-only unauthenticated product route preserves its path and shows the gate", async ({
  page,
}) => {
  const response = await page.goto(
    appUrl(authTestEnvironment.mainBaseUrl, "/files"),
  );
  expect(response?.status()).toBeLessThan(400);
  expect(new URL(page.url()).pathname).toBe("/files");
  await expect(
    page.getByRole("heading", {
      name: "Sign in to access this page",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Sign In", exact: true }),
  ).toBeVisible();
});

test("@read-only expired and failed refresh state recovers to the product gate", async ({
  context,
  page,
}) => {
  const base = new URL(authTestEnvironment.mainBaseUrl);
  await context.addCookies([
    {
      name: CURRENT_COOKIE_NAME,
      value: expiredSessionCookie(),
      domain: base.hostname,
      path: "/",
      secure: base.protocol === "https:",
    },
  ]);

  const response = await page.goto(appUrl(base.toString(), "/files"));
  expect(response?.status()).toBeLessThan(500);
  expect(new URL(page.url()).pathname).toBe("/files");
  await expect(
    page.getByRole("heading", {
      name: "Sign in to access this page",
      exact: true,
    }),
  ).toBeVisible();
});

test("@read-only Admin root sends an anonymous browser to Admin login", async ({
  page,
}) => {
  const response = await page.goto(authTestEnvironment.adminBaseUrl);
  expect(response?.status()).toBeLessThan(400);
  expect(new URL(page.url()).pathname).toBe("/welcome");
  await expect(
    page.getByRole("button", { name: "Sign In", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Continue with Google", exact: true }),
  ).toBeVisible();
});
