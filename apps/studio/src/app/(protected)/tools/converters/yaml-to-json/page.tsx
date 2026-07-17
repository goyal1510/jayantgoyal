import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import YAMLToJSONClient from "./client"

const tool = getToolByPath("/tools/converters/yaml-to-json")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/yaml-to-json")

export default function YAMLToJSONPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <YAMLToJSONClient />
}
