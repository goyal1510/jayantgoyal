import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import PDFSignatureCheckerClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/pdf-signature-checker")

export const metadata: Metadata = buildToolPageMetadata("/tools/parsers-validators/pdf-signature-checker")

export default function PDFSignatureCheckerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PDFSignatureCheckerClient />
}
