import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import RegexTesterClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/regex-tester")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function RegexTesterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RegexTesterClient />
}
