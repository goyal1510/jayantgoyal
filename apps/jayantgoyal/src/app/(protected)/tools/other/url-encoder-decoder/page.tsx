import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import URLEncoderDecoderClient from "./client"

const tool = getToolByPath("/tools/other/url-encoder-decoder")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function URLEncoderDecoderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <URLEncoderDecoderClient />
}
