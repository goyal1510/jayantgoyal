import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TextStatisticsClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-statistics")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function TextStatisticsPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextStatisticsClient />
}
