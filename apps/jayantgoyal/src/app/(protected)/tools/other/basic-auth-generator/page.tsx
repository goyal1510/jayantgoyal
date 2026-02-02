import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import BasicAuthGeneratorClient from "./client"

const tool = getToolByPath("/tools/other/basic-auth-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function BasicAuthGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BasicAuthGeneratorClient />
}
