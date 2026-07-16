import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import NumeronymGeneratorClient from "./client"

const tool = getToolByPath("/tools/text-tools/numeronym-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/numeronym-generator")

export default function NumeronymGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <NumeronymGeneratorClient />
}
