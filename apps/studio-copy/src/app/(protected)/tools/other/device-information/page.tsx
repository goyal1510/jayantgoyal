import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import DeviceInformationClient from "./client"

const tool = getToolByPath("/tools/other/device-information")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/device-information")

export default function DeviceInformationPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <DeviceInformationClient />
}
