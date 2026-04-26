import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TOMLToYAMLClient from "./client"

const tool = getToolByPath("/tools/converters/toml-to-yaml")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function TOMLToYAMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TOMLToYAMLClient />
}
