import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPortfolioData,
  deletePortfolioData,
  fetchPortfolioData,
  savePortfolioSectionPresentation,
  updatePortfolioData,
} from "./portfolio-api";

function response(data: unknown) {
  return new Response(JSON.stringify({ data }), {
    headers: { "Content-Type": "application/json" },
  });
}

describe("Admin Portfolio API adapter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the canonical table and id when reading a singleton", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response({ id: "hero-1" }));

    await fetchPortfolioData("hero", "hero-1");

    expect(fetchMock).toHaveBeenCalledWith("/api/portfolio/hero?id=hero-1");
  });

  it("keeps typed create/update/delete mutations on the requested table", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response({ id: "project-1" }))
      .mockResolvedValueOnce(response({ id: "project-1" }))
      .mockResolvedValueOnce(response({ success: true }));
    const createPayload = {
      name: "Signal",
      slug: "signal",
      eyebrow: "Product system",
      short_description: "A focused workspace.",
      impact: "Made a complex workflow easier to understand.",
      contribution: "Product direction and implementation.",
      year_label: "2026",
      image_url: "/work/signal.png",
      image_alt: "Signal workspace overview",
      case_study: null,
      case_study_published: false,
      tags: ["Next.js"],
      github_link: "",
      live_link: "",
      sort_order: 0,
      is_visible: true,
    };

    await createPortfolioData("work", createPayload);
    await updatePortfolioData("work", "project-1", {
      image_alt: "Updated Signal workspace overview",
    });
    await deletePortfolioData("work", "project-1");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/portfolio/work",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(createPayload),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/portfolio/work?id=project-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          image_alt: "Updated Signal workspace overview",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/portfolio/work?id=project-1",
      { method: "DELETE" },
    );
  });

  it("uses the section-presentation endpoint for copy and navigation saves", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response({ sectionContent: { id: "copy-1" } }));
    const input = {
      section_key: "work" as const,
      copy: {
        eyebrow: "Selected work",
        headline: "Systems with a point of view",
        accent: "",
        description: "A small set of shipped work.",
        supporting_text: "",
        is_visible: true,
      },
      navigation: {
        label: "Work",
        note: "Work",
        sort_order: 4,
        is_visible: true,
      },
    };

    await savePortfolioSectionPresentation(input);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/portfolio/section-presentation",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(input),
      }),
    );
  });
});
