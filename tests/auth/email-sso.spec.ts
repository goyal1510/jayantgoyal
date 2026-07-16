import { expect, test } from "@playwright/test";

import { appUrl, authTestEnvironment } from "./support/environment";

test("@read-only @local-email-sso email/password bootstrap shares the local session", async ({
  browser,
}) => {
  test.skip(
    !authTestEnvironment.fakeSupabase ||
      process.env.PLATFORM_SESSION_ENABLED !== "true",
    "Run the deterministic email SSO proof with the localhost platform flag enabled.",
  );

  const context = await browser.newContext();
  try {
    const authPage = await context.newPage();
    await authPage.goto(
      `${appUrl(authTestEnvironment.authBaseUrl, "/login")}?return_to=${encodeURIComponent(appUrl(authTestEnvironment.mainBaseUrl, "/files"))}`,
    );
    await authPage
      .getByLabel("Email", { exact: true })
      .fill("sso-test@example.com");
    await authPage
      .getByLabel("Password", { exact: true })
      .fill("local-test-password");
    await authPage
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect.poll(() => new URL(authPage.url()).pathname).toBe("/files");

    const cookies = await context.cookies();
    expect(
      cookies.some((cookie) => cookie.name === "jg-session-local-v1"),
    ).toBe(true);
    expect(
      cookies.some((cookie) =>
        cookie.name.startsWith("sb-orwfvyditlguqvxvztkw-auth-token"),
      ),
    ).toBe(false);

    const mainPage = await context.newPage();
    const mainResponse = await mainPage.goto(
      appUrl(authTestEnvironment.mainBaseUrl, "/files"),
    );
    expect(mainResponse?.status()).toBeLessThan(500);
    expect(new URL(mainPage.url()).pathname).toBe("/files");
    await expect(
      mainPage.getByRole("heading", {
        name: "Sign in to access this page",
        exact: true,
      }),
    ).toHaveCount(0);

    const adminPage = await context.newPage();
    await adminPage.goto(authTestEnvironment.adminBaseUrl);
    expect(new URL(adminPage.url()).pathname).toBe("/unauthorized");
  } finally {
    await context.close();
  }
});
