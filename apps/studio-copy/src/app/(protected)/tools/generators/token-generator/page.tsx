import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TokenGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/token-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/token-generator")

export default function TokenGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TokenGeneratorClient />
}
