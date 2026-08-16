"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { toast } from "sonner";

import { safeReturnPath } from "@jayant/web-auth/redirects";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  AuthCard,
  AuthDivider,
  AuthPageShell,
  GoogleSignInButton,
  PasswordField,
} from "@jayant/web-ui/auth-presentation";
import { Button } from "@jayant/web-ui/button";
import { Input } from "@jayant/web-ui/input";
import { Label } from "@jayant/web-ui/label";
import { AccessibleForm } from "@/components/accessible-form";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = safeReturnPath(searchParams.get("redirect"));

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGooglePending, setIsGooglePending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("Login failed");
        return;
      }

      // Check user role
      const { data: profile, error: profileError } = await supabase
        .schema("jg_account")
        .from("profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Profile not found. Contact administrator.");
        router.push("/unauthorized");
        return;
      }

      if (!["admin", "super_admin"].includes(profile.role)) {
        toast.error("You do not have admin access.");
        router.push("/unauthorized");
        return;
      }

      // Check MFA before redirecting
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const hasVerifiedFactor = factorsData?.totp.some(
        (f) => f.status === "verified",
      );
      if (hasVerifiedFactor) {
        const mfaUrl =
          redirectUrl !== "/"
            ? `/mfa-verify?redirect=${encodeURIComponent(redirectUrl)}`
            : "/mfa-verify";
        router.push(mfaUrl);
        router.refresh();
        return;
      }

      toast.success("Login successful!");
      router.push(redirectUrl);
      router.refresh();
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleLogin() {
    setIsGooglePending(true);
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectUrl)}`,
      },
    });
  }

  return (
    <AuthPageShell>
      <AuthCard>
        <AccessibleForm onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter Your Email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <PasswordField
            id="password"
            placeholder="Enter Your Password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isLoading}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <AuthDivider />
          <GoogleSignInButton
            pending={isGooglePending}
            onClick={handleGoogleLogin}
          />
        </AccessibleForm>
      </AuthCard>
    </AuthPageShell>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
