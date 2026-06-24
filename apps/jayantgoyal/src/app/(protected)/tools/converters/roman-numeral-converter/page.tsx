import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import RomanNumeralConverterClient from "./client"

const tool = getToolByPath("/tools/converters/roman-numeral-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/converters/roman-numeral-converter")

export default function RomanNumeralConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RomanNumeralConverterClient />
}
