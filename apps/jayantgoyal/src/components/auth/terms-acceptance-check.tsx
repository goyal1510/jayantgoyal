"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"

import { Button } from "@repo/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@repo/ui/dialog"
import { TermsContent, TERMS_LAST_UPDATED } from "@/components/auth/terms-content"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function TermsAcceptanceCheck() {
  const router = useRouter()
  const [showDialog, setShowDialog] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isChecking, setIsChecking] = React.useState(true)

  React.useEffect(() => {
    const checkTermsAcceptance = async () => {
      try {
        const response = await fetch("/api/account/terms-status")

        // Check if response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("Terms status API did not return JSON")
          return
        }

        if (!response.ok) {
          console.error("Terms status API error:", response.status)
          return
        }

        const data = await response.json()

        if (data.needsAcceptance) {
          setShowDialog(true)
        }
      } catch (error) {
        console.error("Error checking terms acceptance:", error)
      } finally {
        setIsChecking(false)
      }
    }

    checkTermsAcceptance()
  }, [])

  // Prevent any interaction with the page while terms are shown
  React.useEffect(() => {
    if (showDialog) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [showDialog])

  const handleAccept = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/account/accept-terms", {
        method: "POST",
      })

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server error. Please try again.")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to accept terms")
      }

      toast.success("Terms accepted successfully")
      setShowDialog(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept terms")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    setIsLoading(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      toast.info("You must accept the Terms and Conditions to use this platform.")
      router.push("/login")
    } catch {
      toast.error("Failed to sign out")
    } finally {
      setIsLoading(false)
    }
  }

  if (isChecking) {
    return null
  }

  return (
    <Dialog open={showDialog} onOpenChange={() => {}} modal>
      {/* Full black overlay */}
      {showDialog && (
        <div
          className="fixed inset-0 z-[49] bg-black"
          aria-hidden="true"
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
      <DialogContent
        className="max-w-4xl !grid-rows-[auto_1fr_auto] max-h-[90vh] p-0 overflow-hidden [&>button]:hidden z-[51]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-4 bg-muted/30">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="size-6 text-primary" />
            Terms and Conditions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Please carefully review our updated terms to continue using jayantgoyal.com
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md mt-2 inline-block">
            Last Updated: {TERMS_LAST_UPDATED}
          </p>
        </DialogHeader>
        <div className="overflow-y-auto px-6 py-4">
          <TermsContent />
        </div>
        <DialogFooter className="border-t px-6 py-4 flex-row gap-3 bg-muted/30">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            Decline & Logout
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Accepting...
              </>
            ) : (
              "✓ Accept & Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
