"use client"

import { Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { MfaVerifyStep } from "@/components/auth/mfa-verify-step"
import { Card, CardContent } from "@repo/ui/card"
import { CircularLoader } from "@/components/ui/circular-loader"
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
      // Don't use getAuthenticatorAssuranceLevel() — it reads from
      // the local JWT which may be stale after a fresh OAuth session.
      const { data: factors } = await supabase.auth.mfa.listFactors()
      if (factors?.totp.some((f) => f.status === "verified")) {
        setMfaState("required")
        return
      }

      // No MFA factors — redirect through to target
      const url = new URL(redirectUrl, window.location.origin)
      url.searchParams.set("login_success", "true")
      window.location.href = url.toString()
    }

    void checkMfa()
  }, [redirectUrl, router])

  if (mfaState === "loading") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <CircularLoader />
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
    <Suspense fallback={<CircularLoader />}>
      <MfaVerifyContent />
    </Suspense>
  )
}
