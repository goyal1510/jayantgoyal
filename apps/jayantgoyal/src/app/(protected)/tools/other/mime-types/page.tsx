import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import MIMETypesClient from "./client"

const tool = getToolByPath("/tools/other/mime-types")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function MIMETypesPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MIMETypesClient />
}
