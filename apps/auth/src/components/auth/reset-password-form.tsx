"use client";

import { useActionState, useState } from "react";

import { resetPasswordAction } from "@/app/actions/recovery";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { AuthCard, PasswordField } from "@repo/ui/auth-presentation";
import { Label } from "@repo/ui/label";
import { Switch } from "@repo/ui/switch";

const initialState = {};

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPasswordAction, initialState);
  const [globalLogout, setGlobalLogout] = useState(false);

  return (
    <AuthCard>
      <form action={action} className="space-y-5">
        <input
          type="hidden"
          name="scope"
          value={globalLogout ? "global" : "local"}
        />
        <div className="text-center">
          <h1 className="text-2xl font-bold">Choose a new password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            The recovery session is consumed after this change.
          </p>
        </div>
        <PasswordField
          id="password"
          name="password"
          label="New password"
          autoComplete="new-password"
          required
        />
        <PasswordField
          id="confirmation"
          name="confirmation"
          label="Confirm password"
          autoComplete="new-password"
          required
        />
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="global-logout">Sign out every other session</Label>
          <Switch
            id="global-logout"
            checked={globalLogout}
            onCheckedChange={setGlobalLogout}
          />
        </div>
        <ActionMessage state={state} />
        <SubmitButton idleLabel="Update password" pendingLabel="Updating..." />
      </form>
    </AuthCard>
  );
}
