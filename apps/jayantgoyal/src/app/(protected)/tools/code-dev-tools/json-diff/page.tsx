import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import JSONDiffClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/json-diff")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function JSONDiffPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONDiffClient />
}
