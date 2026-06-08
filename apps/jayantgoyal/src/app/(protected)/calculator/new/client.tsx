"use client"

import { CurrencyCalculatorForm } from "@/components/calculator/currency-calculator-form"
import type { WorkspaceAccess } from "@/lib/commerce/entitlements.server"

interface NewCalculatorClientProps {
  workspaceAccess: WorkspaceAccess | null
}

export default function NewCalculatorClient({ workspaceAccess }: NewCalculatorClientProps) {
  return <CurrencyCalculatorForm workspaceAccess={workspaceAccess} />
}
