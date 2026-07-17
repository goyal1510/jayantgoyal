import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import SlugifyStringClient from "./client"

const tool = getToolByPath("/tools/text-tools/slugify-string")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/slugify-string")

export default function SlugifyStringPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <SlugifyStringClient />
}
