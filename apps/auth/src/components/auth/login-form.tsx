"use client";

import { useActionState } from "react";
import Link from "next/link";

import { googleAction, loginAction } from "@/app/actions/entry";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  AuthCard,
  AuthDivider,
  GoogleIcon,
  PasswordField,
} from "@repo/ui/auth-presentation";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

const initialState = {};

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(loginAction, initialState);
  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Continue to Jayant Goyal applications.
          </p>
        </div>
        <form action={action} className="space-y-4">
          <input type="hidden" name="return_to" value={returnTo} />
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <PasswordField
            id="password"
            name="password"
            autoComplete="current-password"
            forgotPasswordHref="/forgot-password"
            required
          />
          <ActionMessage state={state} />
          <SubmitButton idleLabel="Sign in" />
        </form>
        <AuthDivider />
        <form action={googleAction}>
          <input type="hidden" name="return_to" value={returnTo} />
          <button
            type="submit"
            className="border-input bg-background hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors"
          >
            <GoogleIcon className="size-5" />
            Continue with Google
          </button>
        </form>
        <p className="text-center text-sm">
          Need an account?{" "}
          <Link
            className="underline underline-offset-4"
            href={`/register?return_to=${encodeURIComponent(returnTo)}`}
          >
            Register
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
