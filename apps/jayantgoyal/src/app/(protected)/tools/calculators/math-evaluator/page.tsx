import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import MathEvaluatorClient from "./client"

const tool = getToolByPath("/tools/calculators/math-evaluator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function MathEvaluatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MathEvaluatorClient />
}
