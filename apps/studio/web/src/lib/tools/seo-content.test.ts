import { describe, expect, it } from "vitest";

import { toolSeoContentByPath } from "@/lib/tools/seo-content";
import { allTools } from "@/lib/tools/tools";

describe("tool reference content", () => {
  it("covers every tool path without orphaned entries", () => {
    const catalogPaths = allTools.map((tool) => tool.path).sort();
    const referencePaths = Object.keys(toolSeoContentByPath).sort();

    expect(referencePaths).toEqual(catalogPaths);
  });

  it("provides useful reference sections for every tool", () => {
    for (const tool of allTools) {
      const content = toolSeoContentByPath[tool.path];

      expect(content, tool.path).toBeDefined();
      if (!content) {
        throw new Error(`Missing reference content for ${tool.path}`);
      }

      expect(content.summary.trim(), `${tool.path} summary`).not.toBe("");
      expect(
        content.useCases.length,
        `${tool.path} use cases`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        content.examples.length,
        `${tool.path} examples`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        content.considerations.trim(),
        `${tool.path} considerations`,
      ).not.toBe("");

      if (content.faqs) {
        expect(content.faqs.length, `${tool.path} FAQs`).toBeGreaterThanOrEqual(
          2,
        );
      }

      for (const value of [
        ...content.useCases,
        ...content.examples,
        content.considerations,
        ...(content.faqs?.flatMap((faq) => [faq.question, faq.answer]) ?? []),
      ]) {
        expect(value.trim(), tool.path).not.toBe("");
      }
    }
  });
});
