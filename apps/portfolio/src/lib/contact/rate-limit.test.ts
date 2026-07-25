import { describe, expect, it } from "vitest";

import { createContactRateLimitKey } from "./rate-limit";

describe("contact rate-limit keys", () => {
  const secret = "a-dedicated-contact-secret-with-32-chars";

  it("creates a stable, non-reversible key without retaining the IP address", () => {
    const key = createContactRateLimitKey("203.0.113.7", secret);

    expect(key).toMatch(/^[a-f0-9]{64}$/);
    expect(key).toBe(createContactRateLimitKey(" 203.0.113.7 ", secret));
    expect(key).not.toContain("203.0.113.7");
  });

  it("requires a dedicated high-entropy secret", () => {
    expect(() => createContactRateLimitKey("203.0.113.7", "short")).toThrow(
      "CONTACT_RATE_LIMIT_SECRET must be at least 32 characters",
    );
  });
});
