/** Unified auth form — sign in or create account automatically. */
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Home } from "lucide-react";

import { authenticate } from "@/app/welcome/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthDivider,
  GoogleSignInButton,
  PasswordField,
} from "@repo/ui/auth-presentation";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import { toast } from "sonner";

const initialState = { error: "", success: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? "Please wait..." : "Continue"}
    </Button>
  );
}

export function WelcomeForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") ?? "/";
  const errorParam = searchParams.get("error");
  const messageParam = searchParams.get("message");
  const signedOut = searchParams.get("signed_out");

  const [state, formAction] = React.useActionState(authenticate, initialState);
  const [isGooglePending, setIsGooglePending] = React.useState(false);

  const handleGoogleLogin = React.useCallback(() => {
    setIsGooglePending(true);
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    });
  }, [redirectUrl]);

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
    if (state?.success) {
      toast.success(state.success);
    }
  }, [state?.error, state?.success]);

  // Show toasts for query param feedback
  React.useEffect(() => {
    if (signedOut) {
      toast.success("Signed out successfully.");
    }
    if (errorParam) {
      toast.error(decodeURIComponent(errorParam));
    }
    if (messageParam === "password_changed") {
      toast.success(
        "Password updated successfully! Please sign in with your new password.",
      );
    }
    if (errorParam || messageParam || signedOut) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("message");
      url.searchParams.delete("signed_out");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [errorParam, messageParam, signedOut]);

  return (
    <AuthCard className={className} {...props}>
      <form action={formAction} className="flex flex-col gap-6">
        <input type="hidden" name="redirect" value={redirectUrl} />
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Welcome!</h1>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            required
          />
        </div>
        <PasswordField
          id="password"
          name="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          forgotPasswordHref="/forgot-password"
          required
        />
        <div className="grid gap-3">
          <SubmitButton />
        </div>
        <AuthDivider />
        <GoogleSignInButton
          pending={isGooglePending}
          onClick={handleGoogleLogin}
        />
        <Button variant="ghost" asChild className="w-full">
          <Link href="/">
            <Home className="size-4" />
            Back to Home
          </Link>
        </Button>
      </form>
    </AuthCard>
  );
}
