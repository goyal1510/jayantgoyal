import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import WiFiQRCodeGeneratorClient from "./client"

const tool = getToolByPath("/tools/media-qr/wifi-qr-code-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/media-qr/wifi-qr-code-generator")

export default function WiFiQRCodeGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <WiFiQRCodeGeneratorClient />
}
