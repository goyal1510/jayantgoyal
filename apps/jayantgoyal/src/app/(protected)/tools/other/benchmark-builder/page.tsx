import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import BenchmarkBuilderClient from "./client"

const tool = getToolByPath("/tools/other/benchmark-builder")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function BenchmarkBuilderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BenchmarkBuilderClient />
}
