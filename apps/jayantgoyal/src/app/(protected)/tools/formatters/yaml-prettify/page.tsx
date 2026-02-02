import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import YAMLPrettifyClient from "./client"

const tool = getToolByPath("/tools/formatters/yaml-prettify")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function YAMLPrettifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <YAMLPrettifyClient />
}
