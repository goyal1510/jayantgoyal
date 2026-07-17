import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import HTMLEntitiesClient from "./client"

const tool = getToolByPath("/tools/other/html-entities")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/html-entities")

export default function HTMLEntitiesPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HTMLEntitiesClient />
}
