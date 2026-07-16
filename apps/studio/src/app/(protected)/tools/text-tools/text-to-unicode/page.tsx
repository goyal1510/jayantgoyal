import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TextToUnicodeClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-to-unicode")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/text-to-unicode")

export default function TextToUnicodePage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextToUnicodeClient />
}
