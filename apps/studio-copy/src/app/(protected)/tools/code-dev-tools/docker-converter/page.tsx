import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import DockerConverterClient from "./client"

const tool = getToolByPath("/tools/code-dev-tools/docker-converter")

export const metadata: Metadata = buildToolPageMetadata("/tools/code-dev-tools/docker-converter")

export default function DockerConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <DockerConverterClient />
}
