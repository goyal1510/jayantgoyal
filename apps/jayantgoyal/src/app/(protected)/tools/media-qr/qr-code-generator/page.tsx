import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import QRCodeGeneratorClient from "./client"

const tool = getToolByPath("/tools/media-qr/qr-code-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/media-qr/qr-code-generator")

export default function QRCodeGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <QRCodeGeneratorClient />
}
