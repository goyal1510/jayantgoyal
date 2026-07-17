import { describe, expect, it } from "vitest";

import { deliverContactSubmission } from "./server";

describe("Portfolio contact validation", () => {
  it("rejects missing fields before attempting delivery", async () => {
    await expect(deliverContactSubmission({})).resolves.toEqual({
      success: false,
      error: "All fields are required",
      status: 400,
    });
  });

  it("rejects invalid email addresses before attempting delivery", async () => {
    await expect(
      deliverContactSubmission({
        name: "Local Test",
        email: "invalid",
        subject: "Compatibility",
        message: "This must not send an email.",
      }),
    ).resolves.toEqual({
      success: false,
      error: "Invalid email format",
      status: 400,
    });
  });
});
