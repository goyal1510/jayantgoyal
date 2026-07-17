import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import SVGPlaceholderGeneratorClient from "./client"

const tool = getToolByPath("/tools/media-qr/svg-placeholder-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/media-qr/svg-placeholder-generator")

export default function SVGPlaceholderGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <SVGPlaceholderGeneratorClient />
}
