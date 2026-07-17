import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import UserAgentParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/user-agent-parser")

export const metadata: Metadata = buildToolPageMetadata("/tools/parsers-validators/user-agent-parser")

export default function UserAgentParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <UserAgentParserClient />
}
