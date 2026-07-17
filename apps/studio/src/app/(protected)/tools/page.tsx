import type { Metadata } from "next";
import ToolsClient from "./client";
import { buildPublicPageMetadata } from "@/lib/seo/config";
import { allTools, toolCategories } from "@/lib/tools/tools";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Tech Tools",
  description: `${allTools.length} utilities for developers and power users including generators, converters, formatters, and more.`,
  pathname: "/tools",
});

type ToolsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    category?: string | string[];
  }>;
};

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const { q, category } = await searchParams;
  const initialQuery = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");
  const requestedCategory = Array.isArray(category) ? category[0] : category;
  const initialCategory =
    requestedCategory === "favorites" ||
    toolCategories.some((candidate) => candidate.id === requestedCategory)
      ? requestedCategory
      : "all";

  return (
    <ToolsClient
      initialQuery={initialQuery}
      initialCategory={initialCategory}
    />
  );
}
