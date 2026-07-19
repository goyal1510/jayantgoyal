"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/actions/account";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

const initialState = {};

export function ProfileForm({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  const [state, action] = useActionState(updateProfileAction, initialState);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="first-name">First name</Label>
          <Input
            id="first-name"
            name="first_name"
            defaultValue={firstName}
            autoComplete="given-name"
            maxLength={80}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            name="last_name"
            defaultValue={lastName}
            autoComplete="family-name"
            maxLength={80}
          />
        </div>
      </div>
      <ActionMessage state={state} />
      <SubmitButton idleLabel="Save profile" pendingLabel="Saving..." />
    </form>
  );
}
