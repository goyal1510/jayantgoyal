import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import SVGPlaceholderGeneratorClient from "./client"

const tool = getToolByPath("/tools/media-qr/svg-placeholder-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function SVGPlaceholderGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <SVGPlaceholderGeneratorClient />
}
