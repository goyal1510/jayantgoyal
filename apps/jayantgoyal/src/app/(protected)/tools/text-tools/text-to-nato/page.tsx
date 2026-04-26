import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import TextToNATOClient from "./client"

const tool = getToolByPath("/tools/text-tools/text-to-nato")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function TextToNATOPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <TextToNATOClient />
}
