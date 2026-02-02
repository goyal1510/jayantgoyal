import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import DateTimeConverterClient from "./client"

const tool = getToolByPath("/tools/converters/date-time-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function DateTimeConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <DateTimeConverterClient />
}
