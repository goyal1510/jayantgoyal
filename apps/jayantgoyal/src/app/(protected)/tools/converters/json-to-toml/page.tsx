import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JSONToTOMLClient from "./client"

const tool = getToolByPath("/tools/converters/json-to-toml")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/json-to-toml")

export default function JSONToTOMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONToTOMLClient />
}
