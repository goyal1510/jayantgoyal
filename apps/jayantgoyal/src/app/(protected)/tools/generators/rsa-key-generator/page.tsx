import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import RSAKeyGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/rsa-key-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function RSAKeyGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <RSAKeyGeneratorClient />
}
