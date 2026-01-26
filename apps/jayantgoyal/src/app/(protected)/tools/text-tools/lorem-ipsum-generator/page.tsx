import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import LoremIpsumGeneratorClient from "./client"

const tool = getToolByPath("/tools/text-tools/lorem-ipsum-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function LoremIpsumGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <LoremIpsumGeneratorClient />
}
