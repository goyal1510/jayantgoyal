import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import MarkdownToHTMLClient from "./client"

const tool = getToolByPath("/tools/other/markdown-to-html")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function MarkdownToHTMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MarkdownToHTMLClient />
}
