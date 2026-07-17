import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import YAMLToTOMLClient from "./client"

const tool = getToolByPath("/tools/converters/yaml-to-toml")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/yaml-to-toml")

export default function YAMLToTOMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <YAMLToTOMLClient />
}
