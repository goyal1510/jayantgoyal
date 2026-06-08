"use client"

import { useState } from "react"
import { ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@repo/ui/button"

export function BillingPortalButton({ disabled = false }: { disabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false)

  async function openBillingPortal() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/commerce/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Unable to open billing portal.")
      }

      window.location.href = payload.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open billing portal.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={openBillingPortal} disabled={disabled || isLoading}>
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" />}
      Manage billing
    </Button>
  )
}
