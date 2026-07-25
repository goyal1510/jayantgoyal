import {
  PORTFOLIO_WRITING_DETAIL_SELECT_COLUMNS,
  PORTFOLIO_WRITING_SELECT_COLUMNS,
  type PortfolioWritingDetailRecord,
  type PortfolioWritingListRecord,
} from "@repo/portfolio-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WritingPost = PortfolioWritingDetailRecord;
export type WritingListPost = PortfolioWritingListRecord;

export async function getPublishedWritingPosts(): Promise<WritingListPost[]> {
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

export async function getWritingPostBySlug(
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
