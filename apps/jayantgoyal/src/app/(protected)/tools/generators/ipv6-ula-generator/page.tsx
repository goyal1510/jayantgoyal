import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import IPv6ULAGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/ipv6-ula-generator")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function IPv6ULAGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IPv6ULAGeneratorClient />
}
