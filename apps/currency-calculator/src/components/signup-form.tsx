/** Client-side signup form wired to a Supabase server action. */
"use client"

import * as React from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"

import { signupWithEmail } from "@/app/signup/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [state, formAction] = React.useActionState(
    signupWithEmail,
    initialState
  )

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    } else if (state?.success) {
      toast.success(state.success)
    }
  }, [state?.error, state?.success])

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-balance text-muted-foreground">
                Sign up to your Sujago account
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
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="grid gap-3">
              <SubmitButton />
            </div>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Log in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
