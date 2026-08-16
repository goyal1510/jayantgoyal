import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import XMLFormatterClient from "./client"

const tool = getToolByPath("/tools/formatters/xml-formatter")

export const metadata: Metadata = buildToolPageMetadata("/tools/formatters/xml-formatter")

export default function XMLFormatterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <XMLFormatterClient />
}
