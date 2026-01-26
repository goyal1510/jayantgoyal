import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import MACGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/mac-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function MACGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MACGeneratorClient />
}
