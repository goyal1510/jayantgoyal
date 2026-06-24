import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import IPv4RangeExpanderClient from "./client"

const tool = getToolByPath("/tools/network-tools/ipv4-range-expander")

export const metadata: Metadata = buildToolPageMetadata("/tools/network-tools/ipv4-range-expander")

export default function IPv4RangeExpanderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IPv4RangeExpanderClient />
}
