import { describe, expect, it } from "vitest";

import {
  applicationOrigin,
  applicationUrl,
  isApplicationHost,
  normalizeHostname,
  normalizeOrigin,
  rewriteApplicationUrl,
} from "./index";

describe("platform application URLs", () => {
  it("normalizes hosts and origins", () => {
    expect(normalizeHostname("Studio.JayantGoyal.com:443")).toBe(
      "studio.jayantgoyal.com",
    );
    expect(normalizeOrigin("not a URL", "https://jayantgoyal.com/path")).toBe(
      "https://jayantgoyal.com",
    );
  });

  it("resolves application origins and paths", () => {
    expect(applicationOrigin("studio")).toBe("https://studio.jayantgoyal.com");
    expect(applicationOrigin("auth")).toBe("https://auth.jayantgoyal.com");
    expect(applicationUrl("portfolio", "/blog?tag=nextjs")).toBe(
      "https://jayantgoyal.com/blog?tag=nextjs",
    );
    expect(applicationUrl("admin", "/users", "http://localhost:3002")).toBe(
      "http://localhost:3002/users",
    );
  });

  it("recognizes canonical application hosts", () => {
    expect(isApplicationHost("portfolio", "www.jayantgoyal.com")).toBe(true);
    expect(isApplicationHost("portfolio", "jayantgoyal.com:443")).toBe(true);
    expect(isApplicationHost("studio", "studio.jayantgoyal.com")).toBe(true);
    expect(isApplicationHost("auth", "auth.jayantgoyal.com")).toBe(true);
  });

  it("rewrites only URLs owned by the declared source applications", () => {
    expect(
      rewriteApplicationUrl({
        value: "https://jayantgoyal.com/tools/uuid?copy=true#result",
        sourceApps: ["portfolio"],
        targetApp: "studio",
      }),
    ).toBe("https://studio.jayantgoyal.com/tools/uuid?copy=true#result");
    expect(
      rewriteApplicationUrl({
        value: "https://example.com/tools/uuid",
        sourceApps: ["portfolio"],
        targetApp: "studio",
      }),
    ).toBe("https://example.com/tools/uuid");
  });
});
