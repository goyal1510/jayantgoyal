import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ULIDGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/ulid-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/ulid-generator")

export default function ULIDGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ULIDGeneratorClient />
}
