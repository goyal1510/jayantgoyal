import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import ColorConverterClient from "./client"

const tool = getToolByPath("/tools/converters/color-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function ColorConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ColorConverterClient />
}
