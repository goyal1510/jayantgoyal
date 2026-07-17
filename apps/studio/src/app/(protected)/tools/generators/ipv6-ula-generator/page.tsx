import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import IPv6ULAGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/ipv6-ula-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/ipv6-ula-generator")

export default function IPv6ULAGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IPv6ULAGeneratorClient />
}
