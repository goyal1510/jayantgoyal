"use client";

import { FormEvent, useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MFA_RETRY_MESSAGE = "We could not complete that request. Please try again.";

export function MfaForm() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    void supabase.auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (listError) setError(MFA_RETRY_MESSAGE);
      else
        setFactorId(
          data?.totp.find((factor) => factor.status === "verified")?.id ?? null,
        );
    });
  }, []);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId) {
      setError("No verified authenticator factor is enrolled.");
      return;
    }
    const supabase = createSupabaseBrowserClient();
    const { data: challenge, error: challengeError } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(MFA_RETRY_MESSAGE);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyError) setError(MFA_RETRY_MESSAGE);
    else {
      setMessage("Verification complete. You can return to your product.");
      window.location.assign("/");
    }
  }

  return (
    <form className="space-y-4" onSubmit={verify}>
      <label className="block text-sm font-medium text-slate-700">
        Authenticator code
        <input
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 tracking-[0.35em]"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
        />
      </label>
      <button
        className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white"
        type="submit"
      >
        Verify
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
    </form>
  );
}
