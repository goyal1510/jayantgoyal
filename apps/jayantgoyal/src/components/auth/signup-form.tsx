/** Client-side signup form wired to a Supabase server action. */
"use client"

import * as React from "react"
import Link from "next/link"
import { Eye, EyeOff, Home, CheckCircle2 } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useFormStatus } from "react-dom"

import { signupWithEmail, setPassword } from "@/app/signup/actions"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { TermsDialog } from "@/components/auth/terms-dialog"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "sonner"

const initialState = {
  error: "",
  success: "",
}

const passwordInitialState = {
  error: "",
  success: "",
}

type UserStatus = {
  isAnonymous: boolean
  isAuthenticated: boolean
  hasVerifiedEmail: boolean
  needsPassword: boolean
  loading: boolean
}

function SubmitButton({ isAnonymous, isSettingPassword }: { isAnonymous: boolean; isSettingPassword?: boolean }) {
  const { pending } = useFormStatus()

  const getText = () => {
    if (pending) {
      if (isSettingPassword) return "Setting password..."
      if (isAnonymous) return "Sending verification..."
      return "Creating account..."
    }
    if (isSettingPassword) return "Set Password"
    if (isAnonymous) return "Verify Email"
    return "Create account"
  }

  return (
    <Button
      type="submit"
      className="w-full"
      aria-disabled={pending}
      disabled={pending}
    >
      {getText()}
    </Button>
  )
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect") ?? "/"
  const isVerified = searchParams.get("verified") === "true"
  const router = useRouter()

  const [state, formAction] = React.useActionState(
    signupWithEmail,
    initialState
  )
  const [passwordState, passwordFormAction] = React.useActionState(
    setPassword,
    passwordInitialState
  )
  const [showPassword, setShowPassword] = React.useState(false)
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [isGuestPending, startGuestTransition] = React.useTransition()
  const [userStatus, setUserStatus] = React.useState<UserStatus>({
    isAnonymous: false,
    isAuthenticated: false,
    hasVerifiedEmail: false,
    needsPassword: false,
    loading: true,
  })
  const [emailSent, setEmailSent] = React.useState(false)

  // Fetch user status to determine which form to show
  React.useEffect(() => {
    const fetchUserStatus = async () => {
      try {
        const response = await fetch("/api/account/profile", {
          credentials: "include",
        })
        if (response.ok) {
          const data = await response.json()
          const user = data.user
          setUserStatus({
            isAnonymous: user?.isGuest === true,
            isAuthenticated: true,
            hasVerifiedEmail: user?.hasVerifiedEmail === true,
            // If user came from verification link and is authenticated, they need to set password
            // The setPassword action will validate if email is actually confirmed
            needsPassword: isVerified,
            loading: false,
          })
        } else {
          // Not logged in - if they have ?verified=true but no session, redirect to login
          setUserStatus({
            isAnonymous: false,
            isAuthenticated: false,
            hasVerifiedEmail: false,
            needsPassword: false,
            loading: false,
          })
        }
      } catch {
        setUserStatus({
          isAnonymous: false,
          isAuthenticated: false,
          hasVerifiedEmail: false,
          needsPassword: false,
          loading: false,
        })
      }
    }
    fetchUserStatus()
  }, [isVerified])

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

  // Handle signup form state changes
  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    } else if (state?.success) {
      toast.success(state.success)
      if (state?.step === "email_sent") {
        setEmailSent(true)
      } else if (state?.redirectToLogin) {
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    }
  }, [state?.error, state?.success, state?.redirectToLogin, state?.step, router])

  // Handle password form state changes
  React.useEffect(() => {
    if (passwordState?.error) {
      toast.error(passwordState.error)
    } else if (passwordState?.success) {
      toast.success(passwordState.success)
      // Redirect to portfolio after password is set
      setTimeout(() => {
        window.location.href = redirectUrl
      }, 1500)
    }
  }, [passwordState?.error, passwordState?.success, redirectUrl])

  if (userStatus.loading) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show password form when:
  // - User came from verification link (?verified=true)
  // - User is authenticated
  // - User needs to set password (converted from anonymous)
  const showPasswordForm = isVerified && userStatus.isAuthenticated && userStatus.needsPassword

  // If user has ?verified=true but is not authenticated, show message to login
  // This can happen if they opened the verification link in a different browser
  if (isVerified && !userStatus.isAuthenticated) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2 className="size-12 text-green-500" />
              <h1 className="text-2xl font-bold">Email Verified!</h1>
              <p className="text-muted-foreground">
                Your email has been verified. Please log in to continue setting up your account.
              </p>
              <Button asChild className="mt-4">
                <Link href="/login">
                  Log In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show email sent confirmation
  if (emailSent && !showPasswordForm) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2 className="size-12 text-green-500" />
              <h1 className="text-2xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground">
                We&apos;ve sent a verification link to your email. Click the link to verify, then come back here to set your password.
              </p>
              <Button variant="outline" asChild className="mt-4">
                <Link href="/">
                  <Home className="size-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Password form for verified anonymous users
  if (showPasswordForm) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form action={passwordFormAction} className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <CheckCircle2 className="size-8 text-green-500 mb-2" />
                <h1 className="text-2xl font-bold">Email Verified!</h1>
                <p className="text-muted-foreground mt-1">
                  Now set a password to complete your account.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min 8 characters)"
                    autoComplete="new-password"
                    required
                    minLength={8}
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
              <div className="grid gap-3">
                <SubmitButton isAnonymous={false} isSettingPassword />
              </div>
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

  // Main signup form
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">
                {userStatus.isAnonymous ? "Create Your Account" : "Create Account"}
              </h1>
              {userStatus.isAnonymous && (
                <p className="text-muted-foreground text-sm mt-1">
                  Convert your guest session to a permanent account
                </p>
              )}
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
            {/* Only show password field for non-anonymous users (traditional signup) */}
            {!userStatus.isAnonymous && (
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}
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
                  showGuestOption={!userStatus.isAnonymous}
                  isGuestLoading={isGuestPending}
                >
                  <button type="button" className="cursor-pointer text-primary underline underline-offset-4 hover:text-primary/80">
                    Terms and Conditions
                  </button>
                </TermsDialog>
              </Label>
              <input type="hidden" name="termsAccepted" value={termsAccepted ? "true" : "false"} />
            </div>
            <div className="grid gap-3">
              <SubmitButton isAnonymous={userStatus.isAnonymous} />
            </div>
            {!userStatus.isAnonymous && (
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link href={`/login${redirectUrl !== "/" ? `?redirect=${encodeURIComponent(redirectUrl)}` : ""}`} className="underline underline-offset-4">
                  Log in
                </Link>
              </div>
            )}
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
