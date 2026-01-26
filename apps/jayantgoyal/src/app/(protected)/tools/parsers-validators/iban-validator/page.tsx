import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import IBANValidatorClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/iban-validator")

export const metadata: Metadata = {
  title: `${tool?.title} | Jayant Goyal`,
  description: tool?.description,
}

export default function IBANValidatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IBANValidatorClient />
}
