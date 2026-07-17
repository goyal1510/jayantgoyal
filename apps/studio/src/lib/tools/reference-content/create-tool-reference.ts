import { getToolByPath } from "@/lib/tools/tools";

import type { ToolReferenceDetails, ToolSeoContent } from "./types";

export function createToolReference(
  path: string,
  details: ToolReferenceDetails,
): ToolSeoContent {
  const tool = getToolByPath(path);

  if (!tool) {
    throw new Error(
      `Cannot create reference content for unknown tool: ${path}`,
    );
  }

  return {
    summary: details.summary,
    useCases: [...details.useCases],
    examples: [...details.examples],
    considerations: details.considerations,
    ...(details.faqs ? { faqs: [...details.faqs] } : {}),
  };
}
