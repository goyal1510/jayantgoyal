"use client";

import * as React from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

import { safeReturnPath } from "@jayant/web-auth/redirects";
import { Button } from "@jayant/web-ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@jayant/web-ui/input-otp";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function MfaVerifyStep({ redirectUrl }: { redirectUrl: string }) {
  const [code, setCode] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);

  const handleVerify = React.useCallback(
    async (verifyCode?: string) => {
      const codeToUse = verifyCode ?? code;
      if (codeToUse.length !== 6) return;

      setIsPending(true);
      try {
        const supabase = createSupabaseBrowserClient();

        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totp = factorsData.totp.find((f) => f.status === "verified");
        if (!totp) throw new Error("No verified TOTP factor found.");

        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({ factorId: totp.id });
        if (challengeError) throw challengeError;

        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId: totp.id,
          challengeId: challengeData.id,
          code: codeToUse,
        });
        if (verifyError) throw verifyError;

        // Full navigation so cookies refresh properly
        const url = new URL(
          safeReturnPath(redirectUrl),
          window.location.origin,
        );
        url.searchParams.set("login_success", "true");
        window.location.href = url.toString();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Verification failed.";
        toast.error(message);
        setCode("");
      } finally {
        setIsPending(false);
      }
    },
    [code, redirectUrl],
  );

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ShieldCheck className="text-muted-foreground size-10" />
        <h2 className="text-xl font-bold">Two-factor authentication</h2>
        <p className="text-muted-foreground text-sm">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>

      <InputOTP
        maxLength={6}
        value={code}
        onChange={setCode}
        onComplete={(value) => handleVerify(value)}
        disabled={isPending}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>

      <Button
        className="w-full"
        onClick={() => handleVerify()}
        disabled={isPending || code.length !== 6}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify"
        )}
      </Button>
    </div>
  );
}
