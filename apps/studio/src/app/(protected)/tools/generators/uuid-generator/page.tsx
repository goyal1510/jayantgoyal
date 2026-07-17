import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import UUIDGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/uuid-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/uuid-generator")

export default function UUIDGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <UUIDGeneratorClient />
}
