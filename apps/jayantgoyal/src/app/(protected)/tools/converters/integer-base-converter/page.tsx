import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import IntegerBaseConverterClient from "./client"

const tool = getToolByPath("/tools/converters/integer-base-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function IntegerBaseConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IntegerBaseConverterClient />
}
