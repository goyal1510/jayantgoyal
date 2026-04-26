import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import PDFSignatureCheckerClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/pdf-signature-checker")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function PDFSignatureCheckerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PDFSignatureCheckerClient />
}
