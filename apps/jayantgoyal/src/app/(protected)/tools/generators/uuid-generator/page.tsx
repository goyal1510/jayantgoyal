import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import UUIDGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/uuid-generator")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function UUIDGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <UUIDGeneratorClient />
}
