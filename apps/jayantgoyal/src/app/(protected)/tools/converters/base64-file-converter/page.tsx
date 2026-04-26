import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import Base64FileConverterClient from "./client"

const tool = getToolByPath("/tools/converters/base64-file-converter")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function Base64FileConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <Base64FileConverterClient />
}
