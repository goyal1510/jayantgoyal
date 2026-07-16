import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TOMLToJSONClient from "./client"

const tool = getToolByPath("/tools/converters/toml-to-json")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/toml-to-json")

export default function TOMLToJSONPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TOMLToJSONClient />
}
