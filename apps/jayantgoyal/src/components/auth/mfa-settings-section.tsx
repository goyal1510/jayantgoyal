"use client"

import * as React from "react"
import { ShieldCheck, Loader2 } from "lucide-react"

import { Button } from "@repo/ui/button"
import { Label } from "@repo/ui/label"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

import { MfaEnrollmentDialog } from "./mfa-enrollment-dialog"

export function MfaSettingsSection() {
  const [isEnabled, setIsEnabled] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isDisabling, setIsDisabling] = React.useState(false)
  const [enrollOpen, setEnrollOpen] = React.useState(false)

  const fetchStatus = React.useCallback(async () => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error

      const verifiedTotp = data.totp.filter(
        (f) => f.status === "verified"
      )
      setIsEnabled(verifiedTotp.length > 0)
    } catch {
      // Silently fail — section just shows "off" state
    } finally {
      setIsLoading(false)
    }
  }, [])

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
      toast.success("MFA disabled.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disable MFA."
      toast.error(message)
    } finally {
      setIsDisabling(false)
    }
  }, [])

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
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ShieldCheck className="size-4" />
          Two-factor authentication
          {isEnabled && (
            <span className="bg-green-500/10 text-green-600 dark:text-green-400 ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium">
              Active
            </span>
          )}
        </Label>
        {isEnabled ? (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              disabled={isDisabling}
            >
              {isDisabling ? "Disabling..." : "Disable MFA"}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEnrollOpen(true)}
          >
            Enable MFA
          </Button>
        )}
      </div>

      <MfaEnrollmentDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        onSuccess={() => {
          setIsEnabled(true)
        }}
      />
    </>
  )
}
