import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ChronometerClient from "./client"

const tool = getToolByPath("/tools/calculators/chronometer")

export const metadata: Metadata = buildToolPageMetadata("/tools/calculators/chronometer")

export default function ChronometerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ChronometerClient />
}
