import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import Base64EncoderDecoderClient from "./client"

const tool = getToolByPath("/tools/converters/base64-encoder-decoder")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/base64-encoder-decoder")

export default function Base64EncoderDecoderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <Base64EncoderDecoderClient />
}
