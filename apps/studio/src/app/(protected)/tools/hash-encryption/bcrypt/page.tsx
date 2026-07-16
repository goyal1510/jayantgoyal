import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import BcryptClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/bcrypt")

export const metadata: Metadata = buildToolPageMetadata("/tools/hash-encryption/bcrypt")

export default function BcryptPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BcryptClient />
}
