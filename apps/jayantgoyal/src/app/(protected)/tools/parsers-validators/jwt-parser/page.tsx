import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import JWTParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/jwt-parser")

export const metadata: Metadata = buildToolPageMetadata("/tools/parsers-validators/jwt-parser")

export default function JWTParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JWTParserClient />
}
