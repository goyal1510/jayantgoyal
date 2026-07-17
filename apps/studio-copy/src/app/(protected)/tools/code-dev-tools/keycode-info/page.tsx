import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import KeycodeInfoClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/keycode-info")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/keycode-info")

export default function KeycodeInfoPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <KeycodeInfoClient />
}
