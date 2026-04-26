import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import HashTextClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/hash-text")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function HashTextPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HashTextClient />
}
