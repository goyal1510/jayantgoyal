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

interface MfaVerifyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onVerified: () => void
}

export function MfaVerifyDialog({
  open,
  onOpenChange,
  onVerified,
}: MfaVerifyDialogProps) {
  const [code, setCode] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)

  React.useEffect(() => {
    if (open) setCode("")
  }, [open])

  const handleVerify = React.useCallback(async (verifyCode?: string) => {
    const codeToUse = verifyCode ?? code
    if (codeToUse.length !== 6) return

    setIsPending(true)
    try {
      const supabase = createSupabaseBrowserClient()

      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors()
      if (factorsError) throw factorsError

      const totp = factorsData.totp.find((f) => f.status === "verified")
      if (!totp) throw new Error("No verified TOTP factor found.")

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totp.id })
      if (challengeError) throw challengeError

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totp.id,
        challengeId: challengeData.id,
        code: codeToUse,
      })
      if (verifyError) throw verifyError

      onOpenChange(false)
      onVerified()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Verification failed."
      toast.error(message)
      setCode("")
    } finally {
      setIsPending(false)
    }
  }, [code, onOpenChange, onVerified])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Verify your identity</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app to continue.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <InputOTP
            maxLength={6}
            value={code}
            onChange={setCode}
            onComplete={(value) => handleVerify(value)}
            disabled={isPending}
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
            disabled={isPending || code.length !== 6}
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
