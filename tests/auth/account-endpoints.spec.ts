import { expect, test } from "@playwright/test";

import { appUrl, authTestEnvironment } from "./support/environment";

test("@read-only Main account APIs reject anonymous requests", async ({
  request,
}) => {
  const initResponse = await request.get(
    appUrl(authTestEnvironment.mainBaseUrl, "/api/account/init"),
  );
  expect(initResponse.status()).toBe(200);
  await expect(initResponse.json()).resolves.toEqual({
    user: null,
    isAuthenticated: false,
    needsAcceptance: false,
  });

  const cases = [
    { method: "POST", path: "/api/account/accept-terms", status: 401 },
    { method: "DELETE", path: "/api/account/delete", status: 307 },
    { method: "POST", path: "/api/account/mfa-cleanup", status: 307 },
  ];

  for (const item of cases) {
    const response = await request.fetch(
      appUrl(authTestEnvironment.mainBaseUrl, item.path),
      { method: item.method, maxRedirects: 0 },
    );
    expect(response.status()).toBe(item.status);
  }
});

test("@read-only Admin privileged APIs reject anonymous requests", async ({
  request,
}) => {
  for (const path of ["/api/users", "/api/account/delete"]) {
    const response = await request.fetch(
      appUrl(authTestEnvironment.adminBaseUrl, path),
      { method: path.endsWith("delete") ? "DELETE" : "GET", maxRedirects: 0 },
    );
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/welcome");
  }
});
