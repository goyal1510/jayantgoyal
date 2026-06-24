import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import CrontabGeneratorClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/crontab-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/crontab-generator")

export default function CrontabGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <CrontabGeneratorClient />
}
