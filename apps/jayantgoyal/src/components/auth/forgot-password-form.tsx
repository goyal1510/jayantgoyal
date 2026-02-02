"use client"

import * as React from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { Home, CheckCircle2 } from "lucide-react"

import { forgotPassword } from "@/app/forgot-password/actions"
import { Button } from "@repo/ui/button"
import { Card, CardContent } from "@repo/ui/card"
import { Input } from "@repo/ui/input"
import { Label } from "@repo/ui/label"
import { cn } from "@repo/ui/lib/utils"
import { toast } from "sonner"

const initialState = {
  error: "",
  success: false,
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
      {pending ? "Sending..." : "Send Reset Link"}
    </Button>
  )
}

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction] = React.useActionState(
    forgotPassword,
    initialState
  )

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state?.error])

  if (state?.success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2 className="size-12 text-green-500" />
              <h1 className="text-2xl font-bold">Check Your Email</h1>
              <p className="text-muted-foreground">
                If an account exists with that email, we&apos;ve sent a password reset link. Check your inbox and click the link to reset your password.
              </p>
              <div className="flex flex-col gap-2 w-full mt-4">
                <Button asChild>
                  <Link href="/login">Back to Login</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/">
                    <Home className="size-4" />
                    Back to Home
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
          <form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">Forgot Password</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>
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
            <SubmitButton />
            <div className="text-center text-sm">
              Remember your password?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>
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
