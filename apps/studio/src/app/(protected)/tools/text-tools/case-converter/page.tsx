import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import CaseConverterClient from "./client"

const tool = getToolByPath("/tools/text-tools/case-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/case-converter")

export default function CaseConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <CaseConverterClient />
}
