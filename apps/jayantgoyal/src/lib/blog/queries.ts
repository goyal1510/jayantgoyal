import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  tags: string[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .schema("jg_app")
    .from("blog_posts")
    .select(
      "id, title, slug, excerpt, cover_image, tags, published_at, created_at, updated_at"
    )
    .eq("is_published", true)
    .eq("is_visible", true)
    .order("published_at", { ascending: false });
  return (data ?? []) as BlogPost[];
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .schema("jg_app")
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_visible", true)
    .single();
  return (data as BlogPost) ?? null;
}
