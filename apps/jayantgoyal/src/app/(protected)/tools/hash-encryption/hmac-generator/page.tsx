import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import HMACGeneratorClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/hmac-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function HMACGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HMACGeneratorClient />
}
