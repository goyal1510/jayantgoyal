import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import BIP39GeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/bip39-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/bip39-generator")

export default function BIP39GeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BIP39GeneratorClient />
}
