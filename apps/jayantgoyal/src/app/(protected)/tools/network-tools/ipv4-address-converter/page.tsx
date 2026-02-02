import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import IPv4AddressConverterClient from "./client"

const tool = getToolByPath("/tools/network-tools/ipv4-address-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function IPv4AddressConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IPv4AddressConverterClient />
}
