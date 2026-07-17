import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import PasswordStrengthClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/password-strength")

export const metadata: Metadata = buildToolPageMetadata("/tools/hash-encryption/password-strength")

export default function PasswordStrengthPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PasswordStrengthClient />
}
