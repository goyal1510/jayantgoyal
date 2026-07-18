import type { Metadata } from "next";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BlogList } from "./blog-list";

export const metadata: Metadata = { title: "Blog Posts" };

export default async function BlogPage() {
  const supabase = await createSupabaseServerClient();

  const { data: posts } = await supabase
    .schema("jg_app")
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false });

  return <BlogList initialData={posts ?? []} />;
}
