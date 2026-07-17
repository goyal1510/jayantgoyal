import { describe, expect, it } from "vitest";

import { resolveAuthReturnTarget } from "./returns";

describe("Auth return targets", () => {
  it("accepts canonical platform destinations", () => {
    expect(
      resolveAuthReturnTarget(
        "https://studio.jayantgoyal.com/files",
        "https://auth.jayantgoyal.com",
      ),
    ).toBe("https://studio.jayantgoyal.com/files");
  });

  it("accepts exact localhost application ports", () => {
    expect(
      resolveAuthReturnTarget(
        "http://localhost:3002/users",
        "http://localhost:3003",
      ),
    ).toBe("http://localhost:3002/users");
  });

  it("rejects unconfigured Preview and lookalike hosts", () => {
    expect(
      resolveAuthReturnTarget(
        "https://untrusted-preview.vercel.app/phish",
        "https://auth.jayantgoyal.com",
      ),
    ).toBe("/account/security");
    expect(
      resolveAuthReturnTarget(
        "https://admin.jayantgoyal.com.evil.example/phish",
        "https://auth.jayantgoyal.com",
      ),
    ).toBe("/account/security");
  });
});
