"use client";

import { useActionState } from "react";
import Link from "next/link";

import { forgotPasswordAction } from "@/app/actions/recovery";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthCard } from "@repo/ui/auth-presentation";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

const initialState = {};

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPasswordAction, initialState);
  return (
    <AuthCard bare>
      <form action={action} className="space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset your password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            We will send a recovery link if the account exists.
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
        <ActionMessage state={state} />
        <SubmitButton
          idleLabel="Send recovery link"
          pendingLabel="Sending..."
        />
        <p className="text-center text-sm">
          <Link className="underline underline-offset-4" href="/welcome">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
