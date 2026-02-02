import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import XMLToJSONClient from "./client"

const tool = getToolByPath("/tools/converters/xml-to-json")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function XMLToJSONPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <XMLToJSONClient />
}
