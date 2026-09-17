import { describe, expect, it } from "vitest";

import { getCompactSectionHeading } from "./section-heading";

describe("getCompactSectionHeading", () => {
  it("turns slash-separated editorial copy into a concise label and title", () => {
    expect(
      getCompactSectionHeading(
        "Career / The path so far",
        "Each role moved me closer to the whole product.",
      ),
    ).toEqual({
      label: "Career",
      title: "The path so far",
    });
  });

  it("uses the persisted headline when the eyebrow has no separator", () => {
    expect(getCompactSectionHeading("Writing", "Notes from the build")).toEqual(
      {
        label: "Writing",
        title: "Notes from the build",
      },
    );
  });

  it("falls back safely when the compact title is empty", () => {
    expect(getCompactSectionHeading("Contact /", "Start here")).toEqual({
      label: "Contact",
      title: "Start here",
    });
  });
});
