import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import RandomPortGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/random-port-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function RandomPortGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RandomPortGeneratorClient />
}
