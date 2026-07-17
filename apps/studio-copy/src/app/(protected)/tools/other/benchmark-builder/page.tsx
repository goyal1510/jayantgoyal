import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import BenchmarkBuilderClient from "./client"

const tool = getToolByPath("/tools/other/benchmark-builder")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/benchmark-builder")

export default function BenchmarkBuilderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BenchmarkBuilderClient />
}
