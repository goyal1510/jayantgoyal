import { cookies, headers } from "next/headers";

import {
  isTrustedMutationOrigin,
  requestOriginFromHeaders,
} from "@/lib/auth/origin";
import { AUTH_ORIGIN } from "@/lib/auth/returns";
import { isValidPassword } from "@repo/auth/password";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export type MfaEnrollmentResult = AuthActionState & {
  enrollment?: { factorId: string; qrCode: string; secret: string };
};

export const RETURN_COOKIE = "auth_return_to";

export async function actionContext(): Promise<
  { requestOrigin: string } | { error: string }
> {
  const headerStore = await headers();
  const requestOrigin = requestOriginFromHeaders(headerStore, AUTH_ORIGIN);
  if (
    !isTrustedMutationOrigin({
      suppliedOrigin: headerStore.get("origin"),
      requestOrigin,
    })
  ) {
    return {
      error: "This request could not be verified. Refresh and try again.",
    };
  }
  return { requestOrigin };
}

export async function rememberReturnTarget(
  target: string,
  requestOrigin: string,
) {
  (await cookies()).set(RETURN_COOKIE, target, {
    httpOnly: true,
    secure: requestOrigin.startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
}

export function stringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function rawStringField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string): boolean {
  return isValidPassword(value);
}
