import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import MathEvaluatorClient from "./client"

const tool = getToolByPath("/tools/calculators/math-evaluator")

export const metadata: Metadata = buildToolPageMetadata("/tools/calculators/math-evaluator")

export default function MathEvaluatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MathEvaluatorClient />
}
