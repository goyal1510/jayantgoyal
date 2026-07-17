import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import DateTimeConverterClient from "./client"

const tool = getToolByPath("/tools/converters/date-time-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/date-time-converter")

export default function DateTimeConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <DateTimeConverterClient />
}
