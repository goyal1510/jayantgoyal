"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerAction } from "@/app/actions/entry";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthCard, PasswordField } from "@repo/ui/auth-presentation";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

const initialState = {};

export function RegisterForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(registerAction, initialState);
  return (
    <AuthCard>
      <form action={action} className="space-y-5">
        <input type="hidden" name="return_to" value={returnTo} />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            One account for Studio, Admin, and Auth.
          </p>
        </div>
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
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-muted-foreground text-xs">
          Use at least 8 characters with an uppercase letter, number, and
          symbol.
        </p>
        <ActionMessage state={state} />
        <SubmitButton idleLabel="Create account" />
        <p className="text-center text-sm">
          Already registered?{" "}
          <Link
            className="underline underline-offset-4"
            href={`/login?return_to=${encodeURIComponent(returnTo)}`}
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
