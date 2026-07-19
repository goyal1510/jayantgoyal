import { describe, expect, it } from "vitest";

import {
  isValidPassword,
  passwordValidationError,
  PASSWORD_POLICY_MESSAGE,
} from "./password";

describe("shared password policy", () => {
  it("accepts the policy used by Auth and legacy account settings", () => {
    expect(isValidPassword("SecurePass1!")).toBe(true);
    expect(passwordValidationError("SecurePass1!")).toBeNull();
  });

  it("returns the first actionable requirement", () => {
    expect(passwordValidationError("short")).toBe(
      "Password must be at least 8 characters.",
    );
    expect(passwordValidationError("longpassword")).toBe(
      "Password must contain at least one uppercase letter.",
    );
    expect(passwordValidationError("Longpassword")).toBe(
      "Password must contain at least one number.",
    );
    expect(passwordValidationError("Longpassword1")).toBe(
      "Password must contain at least one special character.",
    );
    expect(PASSWORD_POLICY_MESSAGE).toContain("uppercase letter");
  });
});
