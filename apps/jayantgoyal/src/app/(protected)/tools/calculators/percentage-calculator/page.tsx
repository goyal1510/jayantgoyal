import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import PercentageCalculatorClient from "./client"

const tool = getToolByPath("/tools/calculators/percentage-calculator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function PercentageCalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PercentageCalculatorClient />
}
