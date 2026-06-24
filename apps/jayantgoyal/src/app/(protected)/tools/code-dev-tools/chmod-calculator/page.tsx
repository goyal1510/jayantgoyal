import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ChmodCalculatorClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/chmod-calculator")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/chmod-calculator")

export default function ChmodCalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ChmodCalculatorClient />
}
