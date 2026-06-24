import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import EmailNormalizerClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/email-normalizer")

export const metadata: Metadata = buildToolPageMetadata("/tools/parsers-validators/email-normalizer")

export default function EmailNormalizerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <EmailNormalizerClient />
}
