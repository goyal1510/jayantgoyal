import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TOMLToYAMLClient from "./client"

const tool = getToolByPath("/tools/converters/toml-to-yaml")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/toml-to-yaml")

export default function TOMLToYAMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TOMLToYAMLClient />
}
