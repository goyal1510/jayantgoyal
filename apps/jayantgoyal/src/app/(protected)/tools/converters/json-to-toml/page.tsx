import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import JSONToTOMLClient from "./client"

const tool = getToolByPath("/tools/converters/json-to-toml")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function JSONToTOMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONToTOMLClient />
}
