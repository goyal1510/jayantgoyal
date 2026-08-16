import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { buildAuthMfaUrl } from "@jayant/web-auth/entry";

interface PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export const metadata: Metadata = { title: "Verify MFA" };

export default async function MfaVerifyPage({ searchParams }: PageProps) {
  const [params, headerStore] = await Promise.all([searchParams, headers()]);
  redirect(
    buildAuthMfaUrl({
      requestUrl: "http://localhost:3002/mfa-verify",
      requestHeaders: headerStore,
      returnPath: params.redirect,
    }).toString(),
  );
}
