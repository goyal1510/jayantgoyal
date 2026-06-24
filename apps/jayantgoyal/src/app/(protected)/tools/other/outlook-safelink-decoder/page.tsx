import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import OutlookSafeLinkDecoderClient from "./client"

const tool = getToolByPath("/tools/other/outlook-safelink-decoder")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/outlook-safelink-decoder")

export default function OutlookSafeLinkDecoderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <OutlookSafeLinkDecoderClient />
}
