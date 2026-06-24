import type { MetadataRoute } from "next"
import { allTools } from "@/lib/tools/tools"
import { LAST_SIGNIFICANT_UPDATE, SITE_URL } from "@/lib/seo/config"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicPages = [
    { url: SITE_URL, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/tools`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "monthly" as const, priority: 0.8 },
    { url: `${SITE_URL}/blogs`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${SITE_URL}/weather`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "daily" as const, priority: 0.6 },
    { url: `${SITE_URL}/custom-calculator`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${SITE_URL}/github-stats`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "daily" as const, priority: 0.5 },
    { url: `${SITE_URL}/terms-conditions`, lastModified: LAST_SIGNIFICANT_UPDATE, changeFrequency: "yearly" as const, priority: 0.3 },
  ]

  const toolPages = allTools.map((tool) => ({
    url: `${SITE_URL}${tool.path}`,
    lastModified: LAST_SIGNIFICANT_UPDATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))


  const blogPages: MetadataRoute.Sitemap = []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseKey) {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data: posts } = await supabase
      .schema("jg_app")
      .from("blog_posts")
      .select("slug, updated_at")
      .eq("is_published", true)
      .eq("is_visible", true)
    if (posts) {
      blogPages.push(
        ...posts.map((p) => ({
          url: `${SITE_URL}/blog/${p.slug}`,
          lastModified: p.updated_at ?? LAST_SIGNIFICANT_UPDATE,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }))
      )
    }
  }

  return [...publicPages, ...toolPages, ...blogPages]
}
