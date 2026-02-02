import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TokenGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/token-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function TokenGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TokenGeneratorClient />
}
