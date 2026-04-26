import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import DeviceInformationClient from "./client"

const tool = getToolByPath("/tools/other/device-information")

export const metadata: Metadata = {
  title: `${tool?.title}`,
  description: tool?.description,
}

export default function DeviceInformationPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <DeviceInformationClient />
}
