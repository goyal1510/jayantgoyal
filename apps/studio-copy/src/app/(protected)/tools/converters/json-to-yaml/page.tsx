import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JSONToYAMLClient from "./client"

const tool = getToolByPath("/tools/converters/json-to-yaml")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/json-to-yaml")

export default function JSONToYAMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONToYAMLClient />
}
