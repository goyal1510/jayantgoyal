import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JSONPrettifyClient from "./client"

const tool = getToolByPath("/tools/formatters/json-prettify")

export const metadata: Metadata = buildToolPageMetadata("/tools/formatters/json-prettify")

export default function JSONPrettifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONPrettifyClient />
}
