import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import TemperatureConverterClient from "./client"

const tool = getToolByPath("/tools/converters/temperature-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/temperature-converter")

export default function TemperatureConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TemperatureConverterClient />
}
