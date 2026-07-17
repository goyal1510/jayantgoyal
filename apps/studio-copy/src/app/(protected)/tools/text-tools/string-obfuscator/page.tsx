import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import StringObfuscatorClient from "./client"

const tool = getToolByPath("/tools/text-tools/string-obfuscator")

export const metadata: Metadata = buildToolPageMetadata("/tools/text-tools/string-obfuscator")

export default function StringObfuscatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <StringObfuscatorClient />
}
