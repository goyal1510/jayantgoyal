import { describe, expect, it } from "vitest";

import { classifyAuthCallback } from "./callback";

describe("Auth callback classification", () => {
  it("prioritizes provider cancellation", () => {
    expect(
      classifyAuthCallback(
        new URLSearchParams("error=access_denied&code=ignored"),
      ),
    ).toEqual({ kind: "provider-error" });
  });

  it("accepts PKCE authorization codes without exposing them", () => {
    const result = classifyAuthCallback(
      new URLSearchParams("code=synthetic-code"),
    );
    expect(result.kind).toBe("code");
  });

  it("recognizes recovery separately", () => {
    expect(
      classifyAuthCallback(
        new URLSearchParams("token_hash=synthetic&type=recovery"),
      ),
    ).toEqual({
      kind: "otp",
      tokenHash: "synthetic",
      type: "recovery",
      recovery: true,
    });
  });

  it.each(["magiclink", "sms", "phone_change", "unknown"])(
    "rejects unsupported OTP type %s",
    (type) => {
      expect(
        classifyAuthCallback(
          new URLSearchParams(`token_hash=synthetic&type=${type}`),
        ),
      ).toEqual({ kind: "invalid" });
    },
  );
});
