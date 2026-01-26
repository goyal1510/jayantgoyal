import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import NumeronymGeneratorClient from "./client"

const tool = getToolByPath("/tools/text-tools/numeronym-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function NumeronymGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <NumeronymGeneratorClient />
}
