import { describe, expect, it } from "vitest";

import { buildEmailLinkPresentation } from "./hydrated-email-link-state";

describe("buildEmailLinkPresentation", () => {
  it("keeps email addresses and mailto links out of server presentation", () => {
    const email = "hello@example.com";
    const emailCodePoints = Array.from(email, (character) =>
      character.codePointAt(0),
    ).filter((codePoint): codePoint is number => codePoint !== undefined);
    const presentation = buildEmailLinkPresentation(emailCodePoints, false);
    const serialized = JSON.stringify(presentation);

    expect(serialized).not.toContain(email);
    expect(serialized).not.toContain("mailto:");
    expect(presentation).toEqual({
      href: undefined,
      detailLabel: "Email me",
    });
  });

  it("restores the email link after hydration", () => {
    const email = "hello@example.com";
    const emailCodePoints = Array.from(email, (character) =>
      character.codePointAt(0),
    ).filter((codePoint): codePoint is number => codePoint !== undefined);

    expect(buildEmailLinkPresentation(emailCodePoints, true)).toEqual({
      href: `mailto:${email}`,
      detailLabel: email,
    });
  });
});
