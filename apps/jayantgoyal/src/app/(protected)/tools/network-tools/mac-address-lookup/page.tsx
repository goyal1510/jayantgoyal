import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import MACAddressLookupClient from "./client"

const tool = getToolByPath("/tools/network-tools/mac-address-lookup")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function MACAddressLookupPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MACAddressLookupClient />
}
