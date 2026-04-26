import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import URLParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/url-parser")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function URLParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <URLParserClient />
}
