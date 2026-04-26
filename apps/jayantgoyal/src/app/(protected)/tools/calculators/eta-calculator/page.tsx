import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import ETACalculatorClient from "./client"

const tool = getToolByPath("/tools/calculators/eta-calculator")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function ETACalculatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ETACalculatorClient />
}
