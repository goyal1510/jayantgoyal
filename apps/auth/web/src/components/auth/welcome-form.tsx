"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  authenticateAction,
  githubAction,
  googleAction,
} from "@/app/actions/entry";
import { ActionMessage } from "@/components/auth/action-message";
import { SubmitButton } from "@/components/auth/submit-button";
import {
  AuthDivider,
  GithubIcon,
  GoogleIcon,
  PasswordField,
} from "@jayantgoyal/web-ui/auth-presentation";
import { Button } from "@jayantgoyal/web-ui/button";
import { Input } from "@jayantgoyal/web-ui/input";
import { Label } from "@jayantgoyal/web-ui/label";

const initialState = {};

function GoogleSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="h-12 w-full rounded-xl border-[#d8d1c5] bg-white/45 text-[#262528] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-[#f5f1e9] dark:hover:bg-white/10"
      disabled={pending}
    >
      <GoogleIcon className="size-5" />
      {pending ? "Opening Google…" : "Continue with Google"}
    </Button>
  );
}

function GithubSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="h-12 w-full rounded-xl border-[#d8d1c5] bg-white/45 text-[#262528] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-[#f5f1e9] dark:hover:bg-white/10"
      disabled={pending}
    >
      <GithubIcon className="size-5" />
      {pending ? "Opening GitHub…" : "Continue with GitHub"}
    </Button>
  );
}

export function WelcomeForm({ returnTo }: { returnTo: string }) {
  const [state, action] = useActionState(authenticateAction, initialState);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-5xl leading-none tracking-[-0.05em] text-[#1a1a1c] dark:text-[#f5f1e9]">
        Welcome
      </h1>
      <form action={action} className="space-y-5">
        <input type="hidden" name="return_to" value={returnTo} />
        <div className="grid gap-2">
          <Label htmlFor="email" className="sr-only">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email"
            className="h-12 rounded-xl border-[#d8d1c5] bg-white/55 px-4 text-base shadow-none placeholder:text-[#9b9489] focus-visible:border-[#b46f3d] focus-visible:ring-[#b46f3d]/20 dark:border-white/15 dark:bg-white/5 dark:placeholder:text-white/35"
            required
          />
        </div>
        <PasswordField
          id="password"
          name="password"
          labelClassName="sr-only"
          autoComplete="current-password"
          placeholder="Password"
          forgotPasswordHref="/forgot-password"
          className="h-12 rounded-xl border-[#d8d1c5] bg-white/55 px-4 text-base shadow-none placeholder:text-[#9b9489] focus-visible:border-[#b46f3d] focus-visible:ring-[#b46f3d]/20 dark:border-white/15 dark:bg-white/5 dark:placeholder:text-white/35"
          required
        />
        <ActionMessage state={state} />
        <SubmitButton idleLabel="Continue" pendingLabel="Checking…" />
      </form>

      <div className="space-y-5">
        <AuthDivider label="or" />
        <form action={googleAction}>
          <input type="hidden" name="return_to" value={returnTo} />
          <GoogleSubmitButton />
        </form>
        <form action={githubAction}>
          <input type="hidden" name="return_to" value={returnTo} />
          <GithubSubmitButton />
        </form>
      </div>
    </div>
  );
}
