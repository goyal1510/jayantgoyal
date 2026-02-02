import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import CaseConverterClient from "./client"

const tool = getToolByPath("/tools/text-tools/case-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function CaseConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <CaseConverterClient />
}
