/** Client-side login form wired to a Supabase server action. */
"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { Eye, EyeOff, Home } from "lucide-react"

import { loginWithPassword } from "@/app/login/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const initialState = {
  error: "",
}

function SubmitButton({ className }: { className?: string }) {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      className={cn("w-full", className)}
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? "Logging in..." : "Login"}
    </Button>
  )
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") ?? "/"

  const [state, formAction] = React.useActionState(
    loginWithPassword,
    initialState
  )
  const [isGuestPending, startGuestTransition] = React.useTransition()
  const [showPassword, setShowPassword] = React.useState(false)

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
          // Use window.location for full page navigation to ensure cookies are read
          window.location.href = redirectUrl
        } catch (error) {
          // Preserve error shape for potential future handling.
          void error
          toast.error("Guest login failed. Please try again.")
        }
      })()
    })
  }, [redirectUrl])

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state?.error])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form action={formAction} className="flex flex-col gap-6">
            {/* Hidden field to pass redirect URL to server action */}
            <input type="hidden" name="redirect" value={redirectUrl} />
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">Welcome Back</h1>
              {/* <p className="text-balance text-muted-foreground">
                Login to your account
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
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Your Password"
                  autoComplete="current-password"
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
            <div className="grid gap-3">
              <div className="flex flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleGuestLogin}
                  aria-disabled={isGuestPending}
                  disabled={isGuestPending}
                >
                  {isGuestPending ? "Logging in..." : "Login as guest"}
                </Button>
                <SubmitButton className="flex-1" />
              </div>
            </div>
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link href={`/signup${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} className="underline underline-offset-4">
                Sign up
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
