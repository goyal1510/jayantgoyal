import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import RegexCheatsheetClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/regex-cheatsheet")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function RegexCheatsheetPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RegexCheatsheetClient />
}
