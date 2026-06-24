import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import HMACGeneratorClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/hmac-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/hash-encryption/hmac-generator")

export default function HMACGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HMACGeneratorClient />
}
