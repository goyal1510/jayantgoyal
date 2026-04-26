import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TOMLToJSONClient from "./client"

const tool = getToolByPath("/tools/converters/toml-to-json")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function TOMLToJSONPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TOMLToJSONClient />
}
