"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MfaVerifyStep } from "@/components/auth/mfa-verify-step"
import { Card, CardContent } from "@repo/ui/card"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

type MfaState = "loading" | "required" | "not-required"

function MfaVerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectUrl = searchParams.get("redirect") ?? "/"
  const [mfaState, setMfaState] = useState<MfaState>("loading")

  useEffect(() => {
    const checkMfa = async () => {
      const supabase = createSupabaseBrowserClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/welcome"
        return
      }

      // Check factors directly via API call (always accurate).
      const { data: factors } = await supabase.auth.mfa.listFactors()
      if (factors?.totp.some((f) => f.status === "verified")) {
        setMfaState("required")
        return
      }

      // No MFA factors — redirect through
      router.push(redirectUrl)
      router.refresh()
    }

    void checkMfa()
  }, [redirectUrl, router])

  if (mfaState === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="animate-spin size-8 border-2 border-muted-foreground border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <MfaVerifyStep redirectUrl={redirectUrl} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function MfaVerifyPage() {
  return (
    <Suspense fallback={null}>
      <MfaVerifyContent />
    </Suspense>
  )
}
