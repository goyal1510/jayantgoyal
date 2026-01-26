import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import QRCodeGeneratorClient from "./client"

const tool = getToolByPath("/tools/media-qr/qr-code-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function QRCodeGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <QRCodeGeneratorClient />
}
