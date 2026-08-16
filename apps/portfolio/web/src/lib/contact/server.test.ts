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
        project: "A compatibility product.",
        stage: "prototype",
        timeline: "one-to-three-months",
        outcome: "A dependable first release.",
      }),
    ).resolves.toEqual({
      success: false,
      error: "Invalid email format",
      status: 400,
    });
  });

  it("rejects unsupported stage and timeline values", async () => {
    await expect(
      deliverContactSubmission({
        name: "Local Test",
        email: "local@example.com",
        project: "A product.",
        stage: "unknown",
        timeline: "someday",
        outcome: "A release.",
      }),
    ).resolves.toEqual({
      success: false,
      error: "All fields are required",
      status: 400,
    });
  });
});
