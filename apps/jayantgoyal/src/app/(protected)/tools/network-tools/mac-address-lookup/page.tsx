import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import MACAddressLookupClient from "./client"

const tool = getToolByPath("/tools/network-tools/mac-address-lookup")

export const metadata: Metadata = buildToolPageMetadata("/tools/network-tools/mac-address-lookup")

export default function MACAddressLookupPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MACAddressLookupClient />
}
