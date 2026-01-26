import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TemperatureConverterClient from "./client"

const tool = getToolByPath("/tools/converters/temperature-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function TemperatureConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TemperatureConverterClient />
}
