import { expect, test } from "@playwright/test";

import {
  signInAdmin,
  signInMain,
  signOutFromSidebar,
} from "./support/auth-flow";
import {
  appUrl,
  authTestEnvironment,
  getAuthTestPersona,
} from "./support/environment";

test.describe("@authenticated credential-gated journeys", () => {
  test.skip(
    !authTestEnvironment.authenticated,
    "Set AUTH_TEST_ALLOW_AUTHENTICATED=true with disposable personas.",
  );

  test("authenticated Main navigation and refresh remain valid", async ({
    page,
  }) => {
    const persona = getAuthTestPersona("USER");
    test.skip(!persona, "AUTH_TEST_USER_EMAIL/PASSWORD are required.");

    await signInMain(page, persona!, "/files");
    await expect(
      page.getByRole("button", { name: "Continue with Google", exact: true }),
    ).toHaveCount(0);
    await page.reload();
    expect(new URL(page.url()).pathname).toBe("/files");
    await expect(
      page.getByRole("button", { name: "Continue with Google", exact: true }),
    ).toHaveCount(0);
  });

  test("Admin denies a valid non-admin password identity", async ({ page }) => {
    const persona = getAuthTestPersona("NON_ADMIN");
    test.skip(!persona, "AUTH_TEST_NON_ADMIN_EMAIL/PASSWORD are required.");

    await page.goto(appUrl(authTestEnvironment.adminBaseUrl, "/welcome"));
    await page.getByLabel("Email", { exact: true }).fill(persona!.email);
    await page.getByLabel("Password", { exact: true }).fill(persona!.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page).toHaveURL(/\/welcome/);
    await expect(page.getByText("You do not have admin access.")).toBeVisible();
  });

  test("Admin role success requires and completes AAL1 to AAL2 step-up", async ({
    page,
  }) => {
    const persona = getAuthTestPersona("ADMIN");
    test.skip(
      !persona?.totpSecret,
      "AUTH_TEST_ADMIN credentials and TOTP secret are required.",
    );

    await signInAdmin(page, persona!, { requireMfa: true });
    expect(new URL(page.url()).pathname).toBe("/");
    await expect(page.locator('a[href^="/portfolio"]')).not.toHaveCount(0);
  });

  test("visible logout terminates the current browser session", async ({
    page,
  }) => {
    const persona = getAuthTestPersona("USER");
    test.skip(!persona, "AUTH_TEST_USER_EMAIL/PASSWORD are required.");

    await signInMain(page, persona!, "/files");
    await signOutFromSidebar(page);
    await expect(
      page.getByRole("heading", {
        name: "Sign in to access this page",
        exact: true,
      }),
    ).toBeVisible();
  });

  test("global logout invalidates the same identity on both hosts", async ({
    browser,
  }) => {
    test.skip(
      !authTestEnvironment.crossHost,
      "Set AUTH_TEST_CROSS_HOST=true only on approved stable staging.",
    );
    const persona = getAuthTestPersona("ADMIN");
    test.skip(
      !persona?.totpSecret,
      "AUTH_TEST_ADMIN credentials and TOTP secret are required.",
    );

    const context = await browser.newContext();
    const mainPage = await context.newPage();
    const adminPage = await context.newPage();
    await signInMain(mainPage, persona!, "/files");
    await signInAdmin(adminPage, persona!);
    await signOutFromSidebar(mainPage);
    await adminPage.reload();
    await expect(adminPage).toHaveURL(/\/welcome/);
    await context.close();
  });
});
