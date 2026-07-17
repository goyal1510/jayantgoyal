import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import ListConverterClient from "./client"

const tool = getToolByPath("/tools/text-tools/list-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/list-converter")

export default function ListConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ListConverterClient />
}
