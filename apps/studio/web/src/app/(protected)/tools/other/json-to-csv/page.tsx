import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JSONToCSVClient from "./client"

const tool = getToolByPath("/tools/other/json-to-csv")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/json-to-csv")

export default function JSONToCSVPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONToCSVClient />
}
