import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./accessible-form.tsx", import.meta.url),
  "utf8",
);

describe("AccessibleForm contract", () => {
  it("keeps native validation and field associations intact", () => {
    expect(source).toContain("onInvalidCapture={handleInvalid}");
    expect(source).toContain("onInputCapture={handleInput}");
    expect(source).toContain('field.setAttribute("aria-invalid", "true")');
    expect(source).toContain('field.setAttribute("aria-describedby"');
    expect(source).toContain('role="alert" aria-live="assertive"');
    expect(source).not.toContain("noValidate");
  });
});
