import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import PercentageCalculatorClient from "./client"

const tool = getToolByPath("/tools/calculators/percentage-calculator")

export const metadata: Metadata = buildToolPageMetadata("/tools/calculators/percentage-calculator")

export default function PercentageCalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PercentageCalculatorClient />
}
