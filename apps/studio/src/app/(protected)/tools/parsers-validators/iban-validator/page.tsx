import type { Metadata } from "next"
import { getToolByPath } from "@/lib/tools/tools"
import { buildToolPageMetadata } from "@/lib/tools/metadata"
import IBANValidatorClient from "./client"

const tool = getToolByPath("/tools/parsers-validators/iban-validator")

export const metadata: Metadata = buildToolPageMetadata("/tools/parsers-validators/iban-validator")

export default function IBANValidatorPage() {
  if (!tool) {
    return <div>Tool not found</div>
  }

  return <IBANValidatorClient />
}
