import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import HTTPStatusCodesClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/http-status-codes")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function HTTPStatusCodesPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HTTPStatusCodesClient />
}
