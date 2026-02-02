"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

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
  const [step, setStep] = React.useState<"qr" | "verify">("qr")
  const [qrCode, setQrCode] = React.useState("")
  const [secret, setSecret] = React.useState("")
  const [factorId, setFactorId] = React.useState("")
  const [code, setCode] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isVerifying, setIsVerifying] = React.useState(false)

  const reset = React.useCallback(() => {
    setStep("qr")
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
    // Clean up unverified factor
    if (factorId) {
      try {
        const supabase = createSupabaseBrowserClient()
        await supabase.auth.mfa.unenroll({ factorId })
      } catch {
        // Best effort cleanup
      }
    }
    onOpenChange(false)
  }, [factorId, onOpenChange])

  const handleVerify = React.useCallback(async () => {
    if (code.length !== 6 || !factorId) return

    setIsVerifying(true)
    try {
      const supabase = createSupabaseBrowserClient()

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "qr" ? "Set up authenticator" : "Verify code"}
          </DialogTitle>
          <DialogDescription>
            {step === "qr"
              ? "Scan this QR code with your authenticator app."
              : "Enter the 6-digit code from your authenticator app to confirm."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : step === "qr" ? (
          <div className="flex flex-col items-center gap-4">
            {qrCode && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrCode}
                alt="TOTP QR Code"
                className="rounded-lg border"
                width={200}
                height={200}
              />
            )}
            {secret && (
              <div className="w-full space-y-1">
                <p className="text-muted-foreground text-xs">
                  Or enter this secret manually:
                </p>
                <code className="bg-muted block break-all rounded px-3 py-2 text-xs font-mono">
                  {secret}
                </code>
              </div>
            )}
            <Button className="w-full" onClick={() => setStep("verify")}>
              Continue
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={setCode}
              onComplete={handleVerify}
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
              onClick={handleVerify}
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
