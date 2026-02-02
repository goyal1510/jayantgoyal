import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import EncryptDecryptClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/encrypt-decrypt")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function EncryptDecryptPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <EncryptDecryptClient />
}
