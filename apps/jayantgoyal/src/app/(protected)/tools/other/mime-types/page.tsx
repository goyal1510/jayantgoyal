import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import MIMETypesClient from "./client"

const tool = getToolByPath("/tools/other/mime-types")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/mime-types")

export default function MIMETypesPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <MIMETypesClient />
}
