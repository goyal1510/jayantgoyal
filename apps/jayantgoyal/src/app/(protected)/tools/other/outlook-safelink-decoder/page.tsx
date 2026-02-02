import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import OutlookSafeLinkDecoderClient from "./client"

const tool = getToolByPath("/tools/other/outlook-safelink-decoder")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function OutlookSafeLinkDecoderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <OutlookSafeLinkDecoderClient />
}
