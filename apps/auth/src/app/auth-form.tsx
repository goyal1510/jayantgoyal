"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { safeRedirectPath } from "@repo/auth/redirects";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const AUTH_RETRY_MESSAGE = "We could not complete that request. Please try again.";

function callbackErrorMessage(code: string | null) {
  switch (code) {
    case "invalid_callback":
      return "That sign-in link is incomplete. Start again from this page.";
    case "callback_failed":
      return "That sign-in link has expired or was already used. Start again.";
    case "config":
      return "Sign-in is temporarily unavailable. Please try again shortly.";
    default:
      return null;
  }
}

export function LoginForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const next = useMemo(
    () => safeRedirectPath(params.get("next"), "/"),
    [params],
  );
  const callbackError = callbackErrorMessage(params.get("error"));

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(AUTH_RETRY_MESSAGE);
      setBusy(false);
      return;
    }
    window.location.assign(next);
  }

  async function signInWithGoogle() {
    setBusy(true);
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const callback = new URL("/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callback.toString() },
    });
    if (oauthError) {
      setError(AUTH_RETRY_MESSAGE);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="space-y-4" onSubmit={signIn}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <button
        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-800 disabled:opacity-60"
        disabled={busy}
        type="button"
        onClick={signInWithGoogle}
      >
        Continue with Google
      </button>
      {error || callbackError ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error ?? callbackError}
        </p>
      ) : null}
      <div className="flex justify-between text-sm text-slate-600">
        <Link
          className="underline"
          href={`/forgot-password?next=${encodeURIComponent(next)}`}
        >
          Forgot password?
        </Link>
        <Link
          className="underline"
          href={`/register?next=${encodeURIComponent(next)}`}
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = useMemo(
    () => safeRedirectPath(params.get("next"), "/"),
    [params],
  );

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const callback = new URL("/callback", window.location.origin);
    callback.searchParams.set("next", next);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callback.toString() },
    });
    if (signUpError) {
      setError(AUTH_RETRY_MESSAGE);
      return;
    }
    setMessage(
      data.session
        ? "Your account is ready."
        : "Check your email to verify your account.",
    );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={register}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Password
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white"
          type="submit"
        >
          Create account
        </button>
      </form>
      {message ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      <Link
        className="block text-center text-sm text-slate-600 underline"
        href={`/login?next=${encodeURIComponent(next)}`}
      >
        Back to sign in
      </Link>
    </div>
  );
}

export function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const supabase = createSupabaseBrowserClient();
    const callback = new URL("/callback", window.location.origin);
    callback.searchParams.set("next", "/reset-password");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: callback.toString() },
    );
    if (resetError) setError(AUTH_RETRY_MESSAGE);
    else
      setMessage(
        "If an account exists for that address, a recovery email is on its way.",
      );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={requestReset}>
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <button
          className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white"
          type="submit"
        >
          Send recovery email
        </button>
      </form>
      {message ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
      <Link
        className="block text-center text-sm text-slate-600 underline"
        href="/login"
      >
        Back to sign in
      </Link>
    </div>
  );
}

export function PasswordUpdateForm() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) setError(AUTH_RETRY_MESSAGE);
    else
      setMessage(
        "Your password has been updated. You can return to the product you came from.",
      );
  }

  return (
    <div className="space-y-4">
      <form className="space-y-4" onSubmit={updatePassword}>
        <label className="block text-sm font-medium text-slate-700">
          New password
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button
          className="w-full rounded-lg bg-slate-950 px-4 py-2.5 font-medium text-white"
          type="submit"
        >
          Update password
        </button>
      </form>
      {message ? (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      ) : null}
    </div>
  );
}
