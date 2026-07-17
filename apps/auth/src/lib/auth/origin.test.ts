import { describe, expect, it } from "vitest";

import { isTrustedMutationOrigin, requestOriginFromHeaders } from "./origin";

function headers(values: Record<string, string | null>) {
  return { get: (name: string) => values[name] ?? null };
}

describe("Auth mutation origin policy", () => {
  it("uses exact forwarded host and protocol", () => {
    expect(
      requestOriginFromHeaders(
        headers({
          "x-forwarded-host": "auth.jayantgoyal.com",
          "x-forwarded-proto": "https",
        }),
        "https://fallback.invalid",
      ),
    ).toBe("https://auth.jayantgoyal.com");
  });

  it("supports the local Auth port", () => {
    expect(
      requestOriginFromHeaders(
        headers({ host: "localhost:3003" }),
        "https://auth.jayantgoyal.com",
      ),
    ).toBe("http://localhost:3003");
  });

  it("treats a localhost subdomain as HTTP when no forwarded protocol exists", () => {
    expect(
      requestOriginFromHeaders(
        headers({ host: "auth.jayantgoyal.localhost:3003" }),
        "https://auth.jayantgoyal.com",
      ),
    ).toBe("http://auth.jayantgoyal.localhost:3003");
  });

  it("requires exact same-origin mutations", () => {
    expect(
      isTrustedMutationOrigin({
        suppliedOrigin: "https://auth.jayantgoyal.com",
        requestOrigin: "https://auth.jayantgoyal.com",
      }),
    ).toBe(true);
    expect(
      isTrustedMutationOrigin({
        suppliedOrigin: "https://evil.example",
        requestOrigin: "https://auth.jayantgoyal.com",
      }),
    ).toBe(false);
    expect(
      isTrustedMutationOrigin({
        suppliedOrigin: null,
        requestOrigin: "https://auth.jayantgoyal.com",
      }),
    ).toBe(false);
  });
});
