import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import OTPGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/otp-generator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function OTPGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <OTPGeneratorClient />
}
