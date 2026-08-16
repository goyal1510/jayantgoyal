"use client";

import { useActionState } from "react";

import { verifyMfaAction } from "@/app/actions/mfa";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthCard } from "@jayantgoyal/web-ui/auth-presentation";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

const initialState = {};

export function MfaForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(verifyMfaAction, initialState);
  return (
    <AuthCard bare>
      <form action={action} className="space-y-5">
        <input type="hidden" name="return_to" value={returnTo} />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Two-factor authentication</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Enter the six digits from your authenticator app.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
          />
        </div>
        <ActionMessage state={state} />
        <SubmitButton idleLabel="Verify" pendingLabel="Verifying..." />
      </form>
    </AuthCard>
  );
}
