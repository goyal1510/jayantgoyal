import { expect, type Page } from "@playwright/test";

import {
  appUrl,
  authTestEnvironment,
  type AuthTestPersona,
} from "./environment";
import { generateTotp } from "./totp";

async function completeMfaIfRequired(page: Page, persona: AuthTestPersona) {
  if (new URL(page.url()).pathname !== "/mfa-verify") return false;
  if (!persona.totpSecret) {
    throw new Error("The selected test persona requires a TOTP secret.");
  }

  const input = page.locator('input[inputmode="numeric"]');
  await expect(input).toHaveCount(1);
  await input.fill(generateTotp(persona.totpSecret));
  await expect.poll(() => new URL(page.url()).pathname).not.toBe("/mfa-verify");
  return true;
}

export async function signInMain(
  page: Page,
  persona: AuthTestPersona,
  returnPath = "/files",
) {
  const loginUrl = appUrl(
    authTestEnvironment.mainBaseUrl,
    `/welcome?redirect=${encodeURIComponent(returnPath)}`,
  );
  await page.goto(loginUrl);
  await page.getByLabel("Email", { exact: true }).fill(persona.email);
  await page.getByLabel("Password", { exact: true }).fill(persona.password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 20_000 })
    .not.toBe("/welcome");
  await completeMfaIfRequired(page, persona);
  await expect.poll(() => new URL(page.url()).pathname).toBe(returnPath);
}

export async function signInAdmin(
  page: Page,
  persona: AuthTestPersona,
  options: { requireMfa?: boolean } = {},
) {
  await page.goto(appUrl(authTestEnvironment.adminBaseUrl, "/welcome"));
  await page.getByLabel("Email", { exact: true }).fill(persona.email);
  await page.getByLabel("Password", { exact: true }).fill(persona.password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 20_000 })
    .not.toBe("/welcome");
  const completedMfa = await completeMfaIfRequired(page, persona);
  if (options.requireMfa) expect(completedMfa).toBe(true);
}

export async function signOutFromSidebar(page: Page) {
  const trigger = page
    .locator('button[data-sidebar="menu-button"]')
    .filter({ has: page.locator("svg.lucide-user") });
  await expect(trigger).toHaveCount(1);
  await trigger.click();
  await page.getByRole("menuitem", { name: "Log out", exact: true }).click();
}
