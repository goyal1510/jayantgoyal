import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import HTTPStatusCodesClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/http-status-codes")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/http-status-codes")

export default function HTTPStatusCodesPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HTTPStatusCodesClient />
}
