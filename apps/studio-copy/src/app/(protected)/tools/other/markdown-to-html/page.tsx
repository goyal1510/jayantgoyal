import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import MarkdownToHTMLClient from "./client"

const tool = getToolByPath("/tools/other/markdown-to-html")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/markdown-to-html")

export default function MarkdownToHTMLPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MarkdownToHTMLClient />
}
