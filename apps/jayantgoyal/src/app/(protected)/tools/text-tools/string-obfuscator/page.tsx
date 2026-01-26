import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import StringObfuscatorClient from "./client"

const tool = getToolByPath("/tools/text-tools/string-obfuscator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function StringObfuscatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <StringObfuscatorClient />
}
