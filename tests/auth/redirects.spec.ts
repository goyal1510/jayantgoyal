import { expect, test } from "@playwright/test";

import { safeRedirectTarget } from "../../packages/auth/src/redirects";

test("@read-only Auth return targets allow trusted application origins only", () => {
  expect(safeRedirectTarget("/files")).toBe("/files");
  expect(safeRedirectTarget("http://127.0.0.1:3000/files?from=auth")).toBe(
    "http://127.0.0.1:3000/files?from=auth",
  );
  expect(safeRedirectTarget("https://evil.example/files")).toBe("/");
  expect(safeRedirectTarget("//evil.example/files")).toBe("/");
  expect(safeRedirectTarget("/\\evil.example/files")).toBe("/");
});
