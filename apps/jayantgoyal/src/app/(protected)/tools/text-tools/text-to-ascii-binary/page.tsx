import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TextToASCIIBinaryClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-to-ascii-binary")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/text-to-ascii-binary")

export default function TextToASCIIBinaryPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextToASCIIBinaryClient />
}
