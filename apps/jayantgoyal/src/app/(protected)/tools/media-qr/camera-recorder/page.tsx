import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import CameraRecorderClient from "./client"

const tool = getToolByPath("/tools/media-qr/camera-recorder")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function CameraRecorderPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <CameraRecorderClient />
}
