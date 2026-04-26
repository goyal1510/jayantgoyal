import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import EmailNormalizerClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/email-normalizer")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function EmailNormalizerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <EmailNormalizerClient />
}
