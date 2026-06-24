import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import YAMLPrettifyClient from "./client"

const tool = getToolByPath("/tools/formatters/yaml-prettify")

export const metadata: Metadata = buildToolPageMetadata("/tools/formatters/yaml-prettify")

export default function YAMLPrettifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <YAMLPrettifyClient />
}
