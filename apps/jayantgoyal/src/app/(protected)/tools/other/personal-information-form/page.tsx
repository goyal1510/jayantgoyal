import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import PersonalInformationFormClient from "./client"

const tool = getToolByPath("/tools/other/personal-information-form")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant`,
  description: tool?.description,
}

export default function PersonalInformationFormPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <PersonalInformationFormClient />
}
