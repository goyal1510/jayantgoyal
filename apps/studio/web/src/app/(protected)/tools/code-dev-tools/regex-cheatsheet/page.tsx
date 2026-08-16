import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import RegexCheatsheetClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/regex-cheatsheet")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/regex-cheatsheet")

export default function RegexCheatsheetPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RegexCheatsheetClient />
}
