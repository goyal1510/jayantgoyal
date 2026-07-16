import { describe, expect, it } from "vitest";

import { normalizeHostname } from "./surface";

describe("Studio hostname normalization", () => {
  it("normalizes URLs, ports, paths, and casing", () => {
    expect(
      normalizeHostname("HTTPS://Studio.JayantGoyal.com:443/tools"),
    ).toBe("studio.jayantgoyal.com");
  });

  it("returns an empty hostname when the header is absent", () => {
    expect(normalizeHostname(undefined)).toBe("");
    expect(normalizeHostname(null)).toBe("");
    expect(normalizeHostname("")).toBe("");
  });
});
