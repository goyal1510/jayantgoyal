import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import EncryptDecryptClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/encrypt-decrypt")

export const metadata: Metadata = buildToolPageMetadata("/tools/hash-encryption/encrypt-decrypt")

export default function EncryptDecryptPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <EncryptDecryptClient />
}
