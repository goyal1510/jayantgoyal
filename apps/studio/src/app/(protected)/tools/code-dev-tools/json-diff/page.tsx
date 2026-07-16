import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JSONDiffClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/json-diff")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/json-diff")

export default function JSONDiffPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONDiffClient />
}
