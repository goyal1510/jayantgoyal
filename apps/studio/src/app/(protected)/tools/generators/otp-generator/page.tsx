import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import OTPGeneratorClient from "./client"

const tool = getToolByPath("/tools/generators/otp-generator")

export const metadata: Metadata = buildToolPageMetadata("/tools/generators/otp-generator")

export default function OTPGeneratorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <OTPGeneratorClient />
}
