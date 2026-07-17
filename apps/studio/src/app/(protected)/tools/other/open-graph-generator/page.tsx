import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import OpenGraphGeneratorClient from "./client"

const tool = getToolByPath("/tools/other/open-graph-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/open-graph-generator")

export default function OpenGraphGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <OpenGraphGeneratorClient />
}
