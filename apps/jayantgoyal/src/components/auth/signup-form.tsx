/** Client-side signup form wired to a Supabase server action. */
"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Home } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"

import { signupWithEmail } from "@/app/signup/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TermsDialog } from "@/components/auth/terms-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const initialState = {
  error: "",
  success: "",
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? "Creating account..." : "Create account"}
    </Button>
  )
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") ?? "/"
  const router = useRouter()

  const [state, formAction] = React.useActionState(
    signupWithEmail,
    initialState
  )
  const [showPassword, setShowPassword] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [isGuestPending, startGuestTransition] = React.useTransition()

  const handleGuestLogin = React.useCallback(() => {
    startGuestTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/guest-login", {
            method: "POST",
            credentials: "include",
          })

          const contentType = response.headers.get("content-type")
          if (!contentType || !contentType.includes("application/json")) {
            toast.error("Server error. Please try again.")
            return
          }

          const data = await response.json()

          if (!response.ok || !data?.success) {
            toast.error(data?.error ?? "Guest login failed. Please try again.")
            return
          }

          toast.success("Logged in as guest.")
          window.location.href = redirectUrl
        } catch (error) {
          void error
          toast.error("Guest login failed. Please try again.")
        }
      })()
    })
  }, [redirectUrl])

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    } else if (state?.success) {
      toast.success(state.success)
      // If guest user created account, redirect to login after showing message
      if (state?.redirectToLogin) {
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    }
  }, [state?.error, state?.success, state?.redirectToLogin, router])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">Create Account</h1>
              {/* <p className="text-balance text-muted-foreground">
                Sign up to your JG Hub account
              </p> */}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter Your Email"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                name="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                required
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                I agree to the{" "}
                <TermsDialog
                  onAccept={() => setTermsAccepted(true)}
                  onBack={() => setTermsAccepted(false)}
                  onGuestLogin={handleGuestLogin}
                  showGuestOption
                  isGuestLoading={isGuestPending}
                >
                  <button type="button" className="text-primary underline underline-offset-4 hover:text-primary/80">
                    Terms and Conditions
                  </button>
                </TermsDialog>
              </Label>
              <input type="hidden" name="termsAccepted" value={termsAccepted ? "true" : "false"} />
            </div>
            <div className="grid gap-3">
              <SubmitButton />
            </div>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} className="underline underline-offset-4">
                Log in
              </Link>
            </div>
            <Button variant="ghost" asChild className="w-full">
              <Link href="/portfolio">
                <Home className="size-4" />
                Back to Home
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
