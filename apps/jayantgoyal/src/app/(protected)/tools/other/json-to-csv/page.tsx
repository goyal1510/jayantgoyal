import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import JSONToCSVClient from "./client"

const tool = getToolByPath("/tools/other/json-to-csv")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function JSONToCSVPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONToCSVClient />
}
