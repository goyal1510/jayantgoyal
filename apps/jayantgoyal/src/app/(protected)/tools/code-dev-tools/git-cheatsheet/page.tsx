import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import GitCheatsheetClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/git-cheatsheet")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function GitCheatsheetPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <GitCheatsheetClient />
}
