import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { allTools } from "@/lib/tools/tools"
import { LAST_SIGNIFICANT_UPDATE, SITE_URL } from "@/lib/seo/config"
import { isStudioHost } from "@/lib/platform/surface"
import { STUDIO_URL } from "@/lib/platform/urls"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const studio = isStudioHost((await headers()).get("host"))
  const baseUrl = studio ? STUDIO_URL : SITE_URL
  const sharedPublicPages = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/tools", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/weather", changeFrequency: "daily" as const, priority: 0.6 },
    { path: "/custom-calculator", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/github-stats", changeFrequency: "daily" as const, priority: 0.5 },
    { path: "/terms-conditions", changeFrequency: "yearly" as const, priority: 0.3 },
  ]
  const legacyOnlyPages = [
    { path: "/about", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/blogs", changeFrequency: "weekly" as const, priority: 0.8 },
  ]
  const publicPages = [
    ...sharedPublicPages,
    ...(studio ? [] : legacyOnlyPages),
  ].map((page) => ({
    url: new URL(page.path, baseUrl).toString(),
    lastModified: LAST_SIGNIFICANT_UPDATE,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))

  const toolPages = allTools.map((tool) => ({
    url: `${baseUrl}${tool.path}`,
    lastModified: LAST_SIGNIFICANT_UPDATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))


  const blogPages: MetadataRoute.Sitemap = []
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!studio && supabaseUrl && supabaseKey) {
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
