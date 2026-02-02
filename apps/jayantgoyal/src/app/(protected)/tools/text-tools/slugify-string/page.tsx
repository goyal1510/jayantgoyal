import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import SlugifyStringClient from "./client"

const tool = getToolByPath("/tools/text-tools/slugify-string")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function SlugifyStringPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <SlugifyStringClient />
}
