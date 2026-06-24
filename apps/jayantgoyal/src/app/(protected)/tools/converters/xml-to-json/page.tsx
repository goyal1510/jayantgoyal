import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import XMLToJSONClient from "./client"

const tool = getToolByPath("/tools/converters/xml-to-json")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/xml-to-json")

export default function XMLToJSONPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <XMLToJSONClient />
}
