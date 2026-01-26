import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import YAMLToTOMLClient from "./client"

const tool = getToolByPath("/tools/converters/yaml-to-toml")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function YAMLToTOMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <YAMLToTOMLClient />
}
