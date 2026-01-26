import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import SQLPrettifyClient from "./client"

const tool = getToolByPath("/tools/formatters/sql-prettify")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function SQLPrettifyPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <SQLPrettifyClient />
}
