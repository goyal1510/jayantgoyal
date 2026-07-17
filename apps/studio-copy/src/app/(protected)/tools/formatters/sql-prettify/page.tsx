import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import SQLPrettifyClient from "./client"

const tool = getToolByPath("/tools/formatters/sql-prettify")

export const metadata: Metadata = buildToolPageMetadata("/tools/formatters/sql-prettify")

export default function SQLPrettifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <SQLPrettifyClient />
}
