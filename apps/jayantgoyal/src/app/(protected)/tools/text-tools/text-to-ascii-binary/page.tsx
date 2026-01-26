import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TextToASCIIBinaryClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-to-ascii-binary")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function TextToASCIIBinaryPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextToASCIIBinaryClient />
}
