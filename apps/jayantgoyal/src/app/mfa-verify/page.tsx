import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { MfaVerifyStep } from "@/components/auth/mfa-verify-step"
import { Card, CardContent } from "@repo/ui/card"

interface PageProps {
  searchParams: Promise<{ redirect?: string }>
}

export default async function MfaVerifyPage({ searchParams }: PageProps) {
  const { redirect: redirectUrl = "/" } = await searchParams
  const supabase = await createSupabaseServerClient()

  // Check auth — if not signed in, go to welcome
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/welcome")
  }

  // Check MFA factors server-side — if no verified TOTP, skip MFA
  const { data: factors } = await supabase.auth.mfa.listFactors()
  const hasVerifiedFactor = factors?.totp.some((f) => f.status === "verified")

  if (!hasVerifiedFactor) {
    const target = new URL(redirectUrl, "http://n")
    target.searchParams.set("login_success", "true")
    redirect(target.pathname + target.search)
  }

  // MFA required — render the TOTP form
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
