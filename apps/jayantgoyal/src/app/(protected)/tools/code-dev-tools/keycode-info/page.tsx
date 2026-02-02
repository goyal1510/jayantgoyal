import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import KeycodeInfoClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/keycode-info")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function KeycodeInfoPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <KeycodeInfoClient />
}
