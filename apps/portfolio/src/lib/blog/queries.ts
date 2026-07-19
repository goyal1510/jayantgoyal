import {
  PORTFOLIO_BLOG_DETAIL_SELECT_COLUMNS,
  PORTFOLIO_BLOG_SELECT_COLUMNS,
  type PortfolioBlogDetailRecord,
  type PortfolioBlogListRecord,
} from "@repo/portfolio-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BlogPost = PortfolioBlogDetailRecord;
export type BlogListPost = PortfolioBlogListRecord;

export async function getPublishedBlogPosts(): Promise<BlogListPost[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("jg_app")
    .from("blog_posts")
    .select(PORTFOLIO_BLOG_SELECT_COLUMNS)
    .eq("is_published", true)
    .eq("is_visible", true)
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Unable to load Blog posts: ${error.message}`);
  return (data ?? []) as BlogListPost[];
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .schema("jg_app")
    .from("blog_posts")
    .select(PORTFOLIO_BLOG_DETAIL_SELECT_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_visible", true)
    .maybeSingle();

  if (error) throw new Error(`Unable to load Blog post: ${error.message}`);
  return (data as BlogPost | null) ?? null;
}
