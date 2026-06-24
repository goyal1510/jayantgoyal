import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TextStatisticsClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-statistics")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/text-statistics")

export default function TextStatisticsPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextStatisticsClient />
}
