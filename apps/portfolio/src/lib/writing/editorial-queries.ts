import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import {
  PORTFOLIO_WRITING_PREVIEW_SELECT_COLUMNS,
  readStringArray,
  type PortfolioWritingPreviewRow,
} from "@repo/portfolio-data";

import { formatEditorialDate } from "@/lib/writing/date";
import type { WritingPreview } from "@/lib/portfolio/editorial-data";

async function loadPublishedWritingPreviews(): Promise<WritingPreview[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Portfolio Supabase environment is not configured");
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .schema("jg_app")
    .from("writing_posts")
    .select(PORTFOLIO_WRITING_PREVIEW_SELECT_COLUMNS)
    .eq("is_published", true)
    .eq("is_visible", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error)
    throw new Error(`Unable to load Writing previews: ${error.message}`);

  return ((data ?? []) as PortfolioWritingPreviewRow[]).map((post) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "Read the latest note from the workbench.",
    date: formatEditorialDate(post.published_at, "short") ?? "Published",
    tags: readStringArray(post.tags),
  }));
}

const getCachedPublishedWritingPreviews = unstable_cache(
  loadPublishedWritingPreviews,
  ["portfolio-writing-previews"],
  { revalidate: 60, tags: ["portfolio-writing"] },
);

export const getPublishedWritingPreviews = cache(
  getCachedPublishedWritingPreviews,
);
