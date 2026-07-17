const OTP_TYPES = [
  "email",
  "email_change",
  "signup",
  "recovery",
  "invite",
] as const;

export type AuthOtpType = (typeof OTP_TYPES)[number];

export type AuthCallback =
  | { kind: "provider-error" }
  | { kind: "code"; code: string }
  | { kind: "otp"; tokenHash: string; type: AuthOtpType; recovery: boolean }
  | { kind: "invalid" };

export function classifyAuthCallback(
  searchParams: URLSearchParams,
): AuthCallback {
  if (searchParams.has("error")) return { kind: "provider-error" };

  const code = searchParams.get("code");
  if (code) return { kind: "code", code };

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  if (tokenHash && type && OTP_TYPES.includes(type as AuthOtpType)) {
    return {
      kind: "otp",
      tokenHash,
      type: type as AuthOtpType,
      recovery: type === "recovery",
    };
  }

  return { kind: "invalid" };
}
