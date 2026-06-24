import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import BasicAuthGeneratorClient from "./client"

const tool = getToolByPath("/tools/other/basic-auth-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/basic-auth-generator")

export default function BasicAuthGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <BasicAuthGeneratorClient />
}
