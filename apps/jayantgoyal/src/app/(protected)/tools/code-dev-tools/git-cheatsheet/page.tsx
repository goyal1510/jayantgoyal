import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import GitCheatsheetClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/git-cheatsheet")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/git-cheatsheet")

export default function GitCheatsheetPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <GitCheatsheetClient />
}
