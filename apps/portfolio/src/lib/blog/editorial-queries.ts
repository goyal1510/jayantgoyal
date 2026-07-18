import { createClient } from "@supabase/supabase-js";

import { formatEditorialDate } from "@/lib/blog/date";
import type { BlogPreview } from "@/lib/portfolio/editorial-data";

type BlogRow = {
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[] | null;
  published_at: string | null;
};

export async function getPublishedBlogPreviews(): Promise<BlogPreview[]> {
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
    .from("blog_posts")
    .select("title, slug, excerpt, tags, published_at")
    .eq("is_published", true)
    .eq("is_visible", true)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) throw new Error(`Unable to load Blog previews: ${error.message}`);

  return ((data ?? []) as BlogRow[]).map((post) => ({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "Read the latest note from the workbench.",
    date: formatEditorialDate(post.published_at, "short") ?? "Published",
    tags: post.tags ?? [],
  }));
}
