import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import OpenGraphGeneratorClient from "./client"

const tool = getToolByPath("/tools/other/open-graph-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function OpenGraphGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <OpenGraphGeneratorClient />
}
