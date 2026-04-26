import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import YAMLToJSONClient from "./client"

const tool = getToolByPath("/tools/converters/yaml-to-json")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function YAMLToJSONPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <YAMLToJSONClient />
}
