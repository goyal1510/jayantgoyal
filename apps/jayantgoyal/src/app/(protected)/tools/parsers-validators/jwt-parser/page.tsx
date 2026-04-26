import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import JWTParserClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/jwt-parser")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function JWTParserPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <JWTParserClient />
}
