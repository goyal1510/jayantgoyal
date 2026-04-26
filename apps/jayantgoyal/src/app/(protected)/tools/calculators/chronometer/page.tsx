import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import ChronometerClient from "./client"

const tool = getToolByPath("/tools/calculators/chronometer")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function ChronometerPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ChronometerClient />
}
