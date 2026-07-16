import { expect, test } from "@playwright/test";

import { generateTotp } from "./support/totp";

test("@read-only TOTP helper matches the RFC 6238 SHA-1 vector", () => {
  expect(generateTotp("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ", 59_000, 8, 30)).toBe(
    "94287082",
  );
});
