"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { MfaVerifyStep } from "@/components/auth/mfa-verify-step"
import { Card, CardContent } from "@repo/ui/card"

function MfaVerifyContent() {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") ?? "/"

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
