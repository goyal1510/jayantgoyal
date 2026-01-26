import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import IPv4SubnetCalculatorClient from "./client"

const tool = getToolByPath("/tools/network-tools/ipv4-subnet-calculator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function IPv4SubnetCalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IPv4SubnetCalculatorClient />
}
