import type { Metadata } from "next"

import { buildPublicPageMetadata } from "@/lib/seo/config"
import { getToolByPath } from "@/lib/tools/tools"

export function buildToolPageMetadata(pathname: string): Metadata {
  const tool = getToolByPath(pathname)

  return buildPublicPageMetadata({
    title: tool?.title ?? "Developer Tool",
    description: tool?.description ?? "Free browser-based developer tool by Jayant.",
    pathname,
  })
}
