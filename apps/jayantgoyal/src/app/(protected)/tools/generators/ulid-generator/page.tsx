import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import ULIDGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/ulid-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function ULIDGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ULIDGeneratorClient />
}
