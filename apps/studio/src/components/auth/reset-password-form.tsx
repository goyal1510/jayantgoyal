"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, LogIn, AlertCircle, Timer } from "lucide-react"

import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import { signOutSession } from "@repo/auth/logout"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { Switch } from "@repo/ui/switch"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "sonner"
import { Spinner } from "@repo/ui/spinner"

type SessionState = "loading" | "none" | "ready"

function clearRecoveryCookie() {
  document.cookie = "recovery_mode=; path=/; max-age=0"
}

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [showPassword, setShowPassword] = React.useState(false)
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [isPending, setIsPending] = React.useState(false)
  const [sessionState, setSessionState] = React.useState<SessionState>("loading")
  const [signOutAll, setSignOutAll] = React.useState(false)

  const [timeLeft, setTimeLeft] = React.useState(120) // 2 minutes

  React.useEffect(() => {
    const checkSession = async () => {
      // Redirect on refresh: if the page was already visited, sign out
      const hasVisited = sessionStorage.getItem("reset_password_visited")
      if (hasVisited) {
        sessionStorage.removeItem("reset_password_visited")
        const supabase = createSupabaseBrowserClient()
        await signOutSession(supabase)
        clearRecoveryCookie()
        window.location.href = "/welcome"
        return
      }
      sessionStorage.setItem("reset_password_visited", "true")

      const supabase = createSupabaseBrowserClient()
      const { data: { user: sessionUser } } = await supabase.auth.getUser()

      if (!sessionUser) {
        // Clear stale recovery cookie if session is gone
        clearRecoveryCookie()
        setSessionState("none")
        return
      }

      // MFA is enforced at the proxy level — if we reach here, MFA is already passed
      setSessionState("ready")
    }
    checkSession()
  }, [])

  const cleanupAndRedirectToLogin = React.useCallback(async () => {
    sessionStorage.removeItem("reset_password_visited")
    const supabase = createSupabaseBrowserClient()
    await signOutSession(supabase)
    clearRecoveryCookie()
    window.location.href = "/welcome"
  }, [])

  // 2-minute countdown timer — auto-redirect to login when expired
  React.useEffect(() => {
    if (sessionState !== "ready") return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          void cleanupAndRedirectToLogin()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionState, cleanupAndRedirectToLogin])

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      if (password.length < 8) {
        toast.error("Password must be at least 8 characters.")
        return
      }

      if (password !== confirmPassword) {
        toast.error("Passwords do not match.")
        return
      }

      setIsPending(true)

      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient()
          const { error } = await supabase.auth.updateUser({ password })

          if (error) {
            toast.error(error.message)
            return
          }

          // Sign out after password change
          sessionStorage.removeItem("reset_password_visited")
          await signOutSession(supabase, signOutAll ? "global" : "local")
          clearRecoveryCookie()
          window.location.href = "/welcome?message=password_changed"
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unable to update password."
          toast.error(message)
        } finally {
          setIsPending(false)
        }
      })()
    },
    [password, confirmPassword, signOutAll]
  )

  // Loading state while checking session
  if (sessionState === "loading") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No session — invalid or expired link
  if (sessionState === "none") {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <AlertCircle className="size-12 text-destructive" />
              <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button asChild>
                  <Link href="/forgot-password">Request New Link</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/welcome">
                    <LogIn className="size-4" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your new password below.
              </p>
              <div className={cn(
                "flex items-center gap-1.5 text-xs mt-2 font-medium",
                timeLeft <= 30 ? "text-destructive" : "text-muted-foreground"
              )}>
                <Timer className="size-3.5" />
                Session expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sign-out-all" className="text-sm cursor-pointer">
                Sign out from all other devices
              </Label>
              <Switch
                id="sign-out-all"
                checked={signOutAll}
                onCheckedChange={setSignOutAll}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Updating..." : "Update Password"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              type="button"
              onClick={cleanupAndRedirectToLogin}
            >
              <LogIn className="size-4" />
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
