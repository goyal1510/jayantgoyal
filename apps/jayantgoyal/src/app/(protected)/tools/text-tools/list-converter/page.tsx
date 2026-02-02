import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import ListConverterClient from "./client"

const tool = getToolByPath("/tools/text-tools/list-converter")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function ListConverterPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <ListConverterClient />
}
