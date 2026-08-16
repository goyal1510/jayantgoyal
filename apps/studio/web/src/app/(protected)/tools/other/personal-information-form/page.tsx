import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import PersonalInformationFormClient from "./client"

const tool = getToolByPath("/tools/other/personal-information-form")

export const metadata: Metadata = buildToolPageMetadata("/tools/other/personal-information-form")

export default function PersonalInformationFormPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PersonalInformationFormClient />
}
