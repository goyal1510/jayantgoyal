import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import PhoneParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/phone-parser")

export const metadata: Metadata = buildToolPageMetadata("/tools/parsers-validators/phone-parser")

export default function PhoneParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PhoneParserClient />
}
