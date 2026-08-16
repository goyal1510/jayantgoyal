import { textAndParserToolCategories } from "./tool-categories-text";
import { transformationToolCategories } from "./tool-categories-transformation";
import { secondaryToolCategories } from "./tool-categories-secondary";

export type { Tool, ToolCategory } from "./tool-types";
import type { Tool, ToolCategory } from "./tool-types";

/** Canonical ordered registry used to render Studio's tool inventory. */
export const toolCategories: ToolCategory[] = [
  ...transformationToolCategories,
  ...textAndParserToolCategories,
  ...secondaryToolCategories,
];

/** Flattened tool lookup retained for route and metadata consumers. */
export const allTools = toolCategories.flatMap((category) => category.tools);

/** Resolves the owning category for an exact tool route. */
export function getToolCategoryByPath(path: string): ToolCategory | undefined {
  return toolCategories.find((category) =>
    category.tools.some((tool) => tool.path === path),
  );
}

/** Resolves a tool definition for an exact route. */
export function getToolByPath(path: string): Tool | undefined {
  return allTools.find((tool) => tool.path === path);
}
