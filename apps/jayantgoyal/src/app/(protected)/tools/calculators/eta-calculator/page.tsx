import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ETACalculatorClient from "./client"

const tool = getToolByPath("/tools/calculators/eta-calculator")

export const metadata: Metadata = buildToolPageMetadata("/tools/calculators/eta-calculator")

export default function ETACalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ETACalculatorClient />
}
