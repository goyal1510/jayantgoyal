import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import JSONMinifyClient from "./client"

const tool = getToolByPath("/tools/formatters/json-minify")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function JSONMinifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JSONMinifyClient />
}
