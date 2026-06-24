import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import CameraRecorderClient from "./client"

const tool = getToolByPath("/tools/media-qr/camera-recorder")

export const metadata: Metadata = buildToolPageMetadata("/tools/media-qr/camera-recorder")

export default function CameraRecorderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <CameraRecorderClient />
}
