import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import WiFiQRCodeGeneratorClient from "./client"

const tool = getToolByPath("/tools/media-qr/wifi-qr-code-generator")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function WiFiQRCodeGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <WiFiQRCodeGeneratorClient />
}
