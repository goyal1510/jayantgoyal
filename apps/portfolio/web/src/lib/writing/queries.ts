import {
  PORTFOLIO_WRITING_DETAIL_SELECT_COLUMNS,
  PORTFOLIO_WRITING_SELECT_COLUMNS,
  type PortfolioWritingDetailRecord,
  type PortfolioWritingListRecord,
} from "@jayant/portfolio-contracts";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WritingPost = PortfolioWritingDetailRecord;
export type WritingListPost = PortfolioWritingListRecord;

async function loadPublishedWritingPosts(): Promise<WritingListPost[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("jg_app")
    .from("writing_posts")
    .select(PORTFOLIO_WRITING_SELECT_COLUMNS)
    .eq("is_published", true)
    .eq("is_visible", true)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Unable to load Writing posts: ${error.message}`);
  return (data ?? []) as WritingListPost[];
}

const getCachedPublishedWritingPosts = unstable_cache(
  loadPublishedWritingPosts,
  ["portfolio-published-writing"],
  { revalidate: 60, tags: ["portfolio-writing"] },
);

export const getPublishedWritingPosts = cache(getCachedPublishedWritingPosts);

async function loadWritingPostBySlug(
  slug: string,
): Promise<WritingPost | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("jg_app")
    .from("writing_posts")
    .select(PORTFOLIO_WRITING_DETAIL_SELECT_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_visible", true)
    .maybeSingle();

  if (error) throw new Error(`Unable to load Writing post: ${error.message}`);
  return (data as WritingPost | null) ?? null;
}

const getCachedWritingPostBySlug = unstable_cache(
  loadWritingPostBySlug,
  ["portfolio-writing-detail"],
  { revalidate: 60, tags: ["portfolio-writing"] },
);

export const getWritingPostBySlug = cache(getCachedWritingPostBySlug);
