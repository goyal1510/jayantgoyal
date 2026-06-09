/** Unified auth form — sign in or create account automatically. */
"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Eye, EyeOff, Home } from "lucide-react"

import { authenticate } from "@/app/welcome/actions"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "sonner"

const initialState = { error: "", success: "" }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className="w-full"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? "Please wait..." : "Continue"}
    </Button>
  )
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function WelcomeForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") ?? "/"
  const errorParam = searchParams.get("error")
  const messageParam = searchParams.get("message")
  const signedOut = searchParams.get("signed_out")

  const [state, formAction] = React.useActionState(authenticate, initialState)
  const [showPassword, setShowPassword] = React.useState(false)
  const [isGooglePending, setIsGooglePending] = React.useState(false)

  const handleGoogleLogin = React.useCallback(() => {
    setIsGooglePending(true)
    const supabase = createSupabaseBrowserClient()
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    })
  }, [redirectUrl])

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
    if (state?.success) {
      toast.success(state.success)
    }
  }, [state?.error, state?.success])

  // Show toasts for query param feedback
  React.useEffect(() => {
    if (signedOut) {
      toast.success("Signed out successfully.")
    }
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam))
    }
    if (messageParam === "password_changed") {
      toast.success("Password updated successfully! Please sign in with your new password.")
    }
    if (errorParam || messageParam || signedOut) {
      const url = new URL(window.location.href)
      url.searchParams.delete("error")
      url.searchParams.delete("message")
      url.searchParams.delete("signed_out")
      window.history.replaceState({}, "", url.pathname + url.search)
    }
  }, [errorParam, messageParam, signedOut])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form action={formAction} className="flex flex-col gap-6">
              <input type="hidden" name="redirect" value={redirectUrl} />
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome!</h1>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="grid gap-3">
                <SubmitButton />
              </div>
              <div className="relative flex items-center">
                <div className="flex-1 border-t" />
                <span className="px-3 text-xs text-muted-foreground uppercase">or</span>
                <div className="flex-1 border-t" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isGooglePending}
              >
                <GoogleIcon className="size-5" />
                {isGooglePending ? "Redirecting..." : "Continue with Google"}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link href="/">
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
