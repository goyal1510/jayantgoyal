"use client"

import * as React from "react"
import { Check, Copy, Loader2 } from "lucide-react"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@repo/ui/input-otp"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface MfaEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function MfaEnrollmentDialog({
  open,
  onOpenChange,
  onSuccess,
}: MfaEnrollmentDialogProps) {
  const [qrCode, setQrCode] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [factorId, setFactorId] = React.useState("")
  const [code, setCode] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const reset = React.useCallback(() => {
    setQrCode("")
    setSecret("")
    setFactorId("")
    setCode("")
    setIsLoading(false)
    setIsVerifying(false)
  }, [])

  // Enroll a new TOTP factor when dialog opens
  React.useEffect(() => {
    if (!open) return

    reset()
    setIsLoading(true)

    let cancelled = false
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient()

        // Clean up any stale unverified factors before enrolling a new one.
        // Uses admin API since client-side unenroll requires AAL2.
        await fetch("/api/account/mfa-cleanup", { method: "POST" })
        if (cancelled) return

        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        })
        if (error) throw error
        if (cancelled) return

        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setFactorId(data.id)
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error ? err.message : "Failed to start MFA enrollment."
        toast.error(message)
        onOpenChange(false)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, onOpenChange, reset])

  const handleCancel = React.useCallback(async () => {
    onOpenChange(false)
    // Clean up unverified factor in background via admin API
    await fetch("/api/account/mfa-cleanup", { method: "POST" }).catch(() => {})
  }, [onOpenChange])

  const handleVerify = React.useCallback(async (verifyCode?: string) => {
    const codeToUse = verifyCode ?? code
    if (codeToUse.length !== 6 || !factorId) return

    setIsVerifying(true)
    try {
      const supabase = createSupabaseBrowserClient()

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: codeToUse,
      })
      if (verifyError) throw verifyError

      toast.success("MFA enabled successfully.")
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed."
      toast.error(message)
      setCode("")
    } finally {
      setIsVerifying(false)
    }
  }, [code, factorId, onOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) {
        void handleCancel()
      }
    }}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Set up authenticator</DialogTitle>
          <DialogDescription>
            Scan this QR code with your authenticator app, then enter the 6-digit code to confirm.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {qrCode && (
              <div className="rounded-lg border bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCode}
                  alt="TOTP QR Code"
                  width={200}
                  height={200}
                />
              </div>
            )}
            {secret && (
              <div className="w-full space-y-1">
                <p className="text-muted-foreground text-xs">
                  Or enter this secret manually:
                </p>
                <button
                  type="button"
                  className="bg-muted hover:bg-muted/80 relative flex w-full cursor-pointer items-center justify-between gap-2 rounded px-3 py-2 text-left transition-colors"
                  onClick={() => {
                    void navigator.clipboard.writeText(secret).then(() => {
                      setCopied(true)
                      toast.success("Secret copied to clipboard.")
                      setTimeout(() => setCopied(false), 2000)
                    })
                  }}
                >
                  <code className="break-all text-xs font-mono">{secret}</code>
                  {copied ? (
                    <Check className="text-green-500 size-3.5 shrink-0" />
                  ) : (
                    <Copy className="text-muted-foreground size-3.5 shrink-0" />
                  )}
                </button>
              </div>
            )}
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={(value) => handleVerify(value)}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button
              className="w-full"
              onClick={() => handleVerify()}
              disabled={isVerifying || code.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & enable"
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
