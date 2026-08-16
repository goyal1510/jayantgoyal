import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import RSAKeyGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/rsa-key-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/rsa-key-generator")

export default function RSAKeyGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RSAKeyGeneratorClient />
}
