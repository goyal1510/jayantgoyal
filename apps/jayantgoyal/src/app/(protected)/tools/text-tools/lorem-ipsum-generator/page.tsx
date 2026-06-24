import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import LoremIpsumGeneratorClient from "./client"

const tool = getToolByPath("/tools/text-tools/lorem-ipsum-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/lorem-ipsum-generator")

export default function LoremIpsumGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <LoremIpsumGeneratorClient />
}
