import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import UserAgentParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/user-agent-parser")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function UserAgentParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <UserAgentParserClient />
}
