import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import HTMLWYSIWYGEditorClient from "./client"

const tool = getToolByPath("/tools/other/html-wysiwyg-editor")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function HTMLWYSIWYGEditorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HTMLWYSIWYGEditorClient />
}
