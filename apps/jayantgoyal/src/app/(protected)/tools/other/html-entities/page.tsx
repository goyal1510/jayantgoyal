import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import HTMLEntitiesClient from "./client"

const tool = getToolByPath("/tools/other/html-entities")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function HTMLEntitiesPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <HTMLEntitiesClient />
}
