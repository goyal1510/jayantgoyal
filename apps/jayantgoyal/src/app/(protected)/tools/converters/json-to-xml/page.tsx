import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import JSONToXMLClient from "./client"

const tool = getToolByPath("/tools/converters/json-to-xml")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function JSONToXMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONToXMLClient />
}
