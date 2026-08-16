import { describe, expect, it } from "vitest";

import { buildSignedOutLoginUrl, resolveAuthReturnTarget } from "./returns";

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

  it("keeps a validated application destination through canonical logout", () => {
    expect(
      buildSignedOutLoginUrl({
        value: "https://admin.jayantgoyal.com/users",
        requestOrigin: "https://auth.jayantgoyal.com",
      }),
    ).toBe(
      "https://auth.jayantgoyal.com/welcome?signed_out=true&return_to=https%3A%2F%2Fadmin.jayantgoyal.com%2Fusers",
    );
  });

  it("drops an unsafe logout destination", () => {
    expect(
      buildSignedOutLoginUrl({
        value: "https://evil.example/phish",
        requestOrigin: "https://auth.jayantgoyal.com",
      }),
    ).toBe("https://auth.jayantgoyal.com/welcome?signed_out=true");
  });
});
