import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TextDiffClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-diff")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/text-diff")

export default function TextDiffPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextDiffClient />
}
