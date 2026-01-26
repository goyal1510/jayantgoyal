import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import ChmodCalculatorClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/chmod-calculator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function ChmodCalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ChmodCalculatorClient />
}
