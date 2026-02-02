import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TextDiffClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-diff")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function TextDiffPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextDiffClient />
}
