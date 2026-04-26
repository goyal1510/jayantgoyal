import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import BcryptClient from "./client"

const tool = getToolByPath("/tools/hash-encryption/bcrypt")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function BcryptPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BcryptClient />
}
