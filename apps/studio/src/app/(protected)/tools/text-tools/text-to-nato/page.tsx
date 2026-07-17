import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TextToNATOClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-to-nato")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/text-to-nato")

export default function TextToNATOPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextToNATOClient />
}
