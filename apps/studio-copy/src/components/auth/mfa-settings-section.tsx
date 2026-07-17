"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { Label } from "@repo/ui/label"
import { Switch } from "@repo/ui/switch"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

import { MfaEnrollmentDialog } from "./mfa-enrollment-dialog"
import { MfaVerifyDialog } from "./mfa-verify-dialog"

export function MfaSettingsSection({
  onStatusChange,
}: {
  onStatusChange?: (enabled: boolean) => void
}) {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDisabling, setIsDisabling] = React.useState(false)
  const [enrollOpen, setEnrollOpen] = React.useState(false)
  const [verifyOpen, setVerifyOpen] = React.useState(false)

  const fetchStatus = React.useCallback(async () => {
    try {
      // Always clean up any dangling unverified factors via admin API
      await fetch("/api/account/mfa-cleanup", { method: "POST" })

      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error

      const verifiedTotp = data.totp.filter(
        (f) => f.status === "verified"
      )
      const enabled = verifiedTotp.length > 0
      setIsEnabled(enabled)
      onStatusChange?.(enabled)
    } catch {
      // Silently fail — section just shows "off" state
    } finally {
      setIsLoading(false)
    }
  }, [onStatusChange])

  React.useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  const handleDisable = React.useCallback(async () => {
    setIsDisabling(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error

      for (const factor of data.totp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      setIsEnabled(false)
      onStatusChange?.(false)
      toast.success("MFA disabled.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disable MFA."
      toast.error(message)
    } finally {
      setIsDisabling(false)
    }
  }, [onStatusChange])

  const handleToggle = React.useCallback(
    (checked: boolean) => {
      if (checked) {
        setEnrollOpen(true)
      } else {
        setVerifyOpen(true)
      }
    },
    []
  )

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
        <span className="text-muted-foreground text-sm">
          Loading MFA status...
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="mfa-toggle">Multi-Factor Authentication</Label>
        <Switch
          id="mfa-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isDisabling}
        />
      </div>

      <MfaEnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onSuccess={() => {
          setIsEnabled(true)
          onStatusChange?.(true)
        }}
      />

      <MfaVerifyDialog
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
        onVerified={() => {
          void handleDisable()
        }}
      />
    </>
  )
}
