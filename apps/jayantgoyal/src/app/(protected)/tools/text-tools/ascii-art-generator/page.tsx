import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ASCIIArtGeneratorClient from "./client"

const tool = getToolByPath("/tools/text-tools/ascii-art-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/ascii-art-generator")

export default function ASCIIArtGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ASCIIArtGeneratorClient />
}
