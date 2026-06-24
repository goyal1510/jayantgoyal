import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import RegexTesterClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/regex-tester")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/regex-tester")

export default function RegexTesterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RegexTesterClient />
}
