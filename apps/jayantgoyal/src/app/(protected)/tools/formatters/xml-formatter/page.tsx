import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import XMLFormatterClient from "./client"

const tool = getToolByPath("/tools/formatters/xml-formatter")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function XMLFormatterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <XMLFormatterClient />
}
