import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import HashTextClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/hash-text")

export const metadata: Metadata = buildToolPageMetadata("/tools/hash-encryption/hash-text")

export default function HashTextPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HashTextClient />
}
