import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JSONMinifyClient from "./client"

const tool = getToolByPath("/tools/formatters/json-minify")

export const metadata: Metadata = buildToolPageMetadata("/tools/formatters/json-minify")

export default function JSONMinifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONMinifyClient />
}
