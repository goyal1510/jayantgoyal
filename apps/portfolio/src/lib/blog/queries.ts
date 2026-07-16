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

const BLOG_LIST_COLUMNS =
  "id, title, slug, excerpt, cover_image, tags, published_at, created_at, updated_at";

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .schema("jg_app")
      .from("blog_posts")
      .select(BLOG_LIST_COLUMNS)
      .eq("is_published", true)
      .eq("is_visible", true)
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Unable to load published blog posts", error.message);
      return [];
    }

    return (data ?? []) as BlogPost[];
  } catch (error) {
    console.error(
      "Unable to initialize the public blog data source",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .schema("jg_app")
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .eq("is_visible", true)
      .maybeSingle();

    if (error) {
      console.error("Unable to load blog post", error.message);
      return null;
    }

    return (data as BlogPost | null) ?? null;
  } catch (error) {
    console.error(
      "Unable to initialize the public blog data source",
      error instanceof Error ? error.message : "Unknown error",
    );
    return null;
  }
}
