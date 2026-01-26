import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TextToUnicodeClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-to-unicode")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function TextToUnicodePage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextToUnicodeClient />
}
