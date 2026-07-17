import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ColorConverterClient from "./client"

const tool = getToolByPath("/tools/converters/color-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/color-converter")

export default function ColorConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ColorConverterClient />
}
