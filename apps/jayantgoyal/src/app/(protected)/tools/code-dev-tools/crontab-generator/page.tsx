import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import CrontabGeneratorClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/crontab-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function CrontabGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <CrontabGeneratorClient />
}
