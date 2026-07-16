import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import RandomPortGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/random-port-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/random-port-generator")

export default function RandomPortGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RandomPortGeneratorClient />
}
