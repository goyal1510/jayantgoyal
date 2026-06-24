import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import MACGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/mac-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/mac-generator")

export default function MACGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MACGeneratorClient />
}
