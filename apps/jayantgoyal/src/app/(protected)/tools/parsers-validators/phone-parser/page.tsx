import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import PhoneParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/phone-parser")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function PhoneParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PhoneParserClient />
}
