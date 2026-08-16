"use client";

import { useActionState } from "react";

import { changePasswordAction } from "@/app/actions/account";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { PasswordField } from "@jayant/web-ui/auth-presentation";

const initialState = {};

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initialState);
  return (
    <form action={action} className="space-y-4">
      <PasswordField
        id="current-password"
        name="current_password"
        label="Current password"
        autoComplete="current-password"
        required
      />
      <PasswordField
        id="new-password"
        name="password"
        label="New password"
        autoComplete="new-password"
        required
      />
      <PasswordField
        id="new-password-confirmation"
        name="confirmation"
        label="Confirm new password"
        autoComplete="new-password"
        required
      />
      <p className="text-muted-foreground text-xs">
        Use at least 8 characters with an uppercase letter, number, and symbol.
      </p>
      <ActionMessage state={state} />
      <SubmitButton idleLabel="Update password" pendingLabel="Updating..." />
    </form>
  );
}
