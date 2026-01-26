"use client"

import * as React from "react"
import { Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { TermsContent, TERMS_LAST_UPDATED } from "@/components/auth/terms-content"

interface TermsDialogProps {
  children: React.ReactNode
  onAccept?: () => void
  onBack?: () => void
  onGuestLogin?: () => void
  showGuestOption?: boolean
  isGuestLoading?: boolean
}

export function TermsDialog({
  children,
  onAccept,
  onBack,
  onGuestLogin,
  showGuestOption = false,
  isGuestLoading = false,
}: TermsDialogProps) {
  const [open, setOpen] = React.useState(false)

  const handleBack = () => {
    onBack?.()
    setOpen(false)
  }

  const handleContinue = () => {
    onAccept?.()
    setOpen(false)
  }

  const handleGuestLogin = () => {
    onGuestLogin?.()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl !grid-rows-[auto_1fr_auto] max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4 bg-muted/30">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Terms and Conditions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please carefully review our terms to continue using jayantgoyal.com
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md mt-2 inline-block">
            Last Updated: {TERMS_LAST_UPDATED}
          </p>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-4">
          <TermsContent />
        </div>
        {(onAccept || onBack || showGuestOption) && (
          <DialogFooter className="border-t px-6 py-4 flex-row gap-2 bg-muted/30">
            {onBack && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
            )}
            {showGuestOption && onGuestLogin && (
              <Button
                variant="secondary"
                onClick={handleGuestLogin}
                className="flex-1"
                disabled={isGuestLoading}
              >
                {isGuestLoading ? "Logging in..." : "Continue as guest"}
              </Button>
            )}
            {onAccept && (
              <Button onClick={handleContinue} className="flex-1">
                Continue
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
