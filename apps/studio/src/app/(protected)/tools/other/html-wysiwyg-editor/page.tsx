import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import HTMLWYSIWYGEditorClient from "./client"

const tool = getToolByPath("/tools/other/html-wysiwyg-editor")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/html-wysiwyg-editor")

export default function HTMLWYSIWYGEditorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HTMLWYSIWYGEditorClient />
}
